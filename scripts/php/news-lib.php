<?php
// Shared by news-preview.php, sitemap.php and rss.php. Copied to dist/ by
// scripts/prepare-deploy.mjs, next to news-config.php, which it generates.
// .htaccess blocks both from being requested directly.
//
// Written for PHP 7.4+ (cPanel hosts often lag behind).

declare(strict_types=1);

const NEWS_PAGE_SIZE = 100; // the CMS maximum

/** Build-time settings: site and CMS addresses, page list, JSON-LD. */
function news_config(): array
{
    static $config = null;
    if ($config === null) {
        $config = require __DIR__ . '/news-config.php';
    }
    return $config;
}

// ── CMS requests, cached ────────────────────────────────────────────────────
// Each answer is kept on disk for a few minutes, so a crawler burst doesn't
// become a burst of CMS requests. When the CMS can't be reached, the last good
// answer is used however old it is, so pages keep working through an outage.

function news_cache_file(string $key): string
{
    $dir = rtrim(sys_get_temp_dir(), '/') . '/netpro-news-' . md5(__DIR__);
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    return $dir . '/' . md5($key) . '.json';
}

/** One GET to the CMS: [HTTP status (0 if unreachable), decoded body or null]. */
function news_http_get(string $url): array
{
    $status = 0;
    $body = false;

    if (function_exists('curl_init')) {
        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 4,
            CURLOPT_TIMEOUT => 8,
            CURLOPT_HTTPHEADER => ['Accept: application/json'],
        ]);
        $body = curl_exec($curl);
        $status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
        if (PHP_VERSION_ID < 80000) {
            curl_close($curl); // a no-op from PHP 8, deprecated in 8.5
        }
    } else {
        $body = @file_get_contents($url, false, stream_context_create([
            'http' => ['header' => "Accept: application/json\r\n", 'timeout' => 8, 'ignore_errors' => true],
        ]));
        // PHP 8.4+ deprecates the magic $http_response_header variable.
        $headers = function_exists('http_get_last_response_headers')
            ? (http_get_last_response_headers() ?? [])
            : ($http_response_header ?? []);
        if (isset($headers[0]) && preg_match('/\s(\d{3})\s/', $headers[0], $m)) {
            $status = (int) $m[1];
        }
    }

    $data = is_string($body) ? json_decode($body, true) : null;
    return [$status, is_array($data) ? $data : null];
}

/**
 * GET a CMS path, cached for $ttl seconds.
 * Returns ['status' => int, 'data' => ?array, 'stale' => bool].
 * A 404 is cached too (briefly), so a dead link can't hammer the CMS.
 */
function news_cms_get(string $path, int $ttl): array
{
    $config = news_config();
    if ($config['cmsOrigin'] === '') {
        return ['status' => 0, 'data' => null, 'stale' => false];
    }

    $url = $config['cmsOrigin'] . $path;
    $file = news_cache_file($url);
    $cached = is_file($file) ? json_decode((string) @file_get_contents($file), true) : null;

    if (is_array($cached) && time() - (int) @filemtime($file) < $ttl) {
        return ['status' => (int) $cached['status'], 'data' => $cached['data'], 'stale' => false];
    }

    [$status, $data] = news_http_get($url);
    $answered = ($status >= 200 && $status < 300 && $data !== null) || $status === 404;

    if ($answered) {
        $tmp = $file . '.' . getmypid() . '.tmp';
        if (@file_put_contents($tmp, json_encode(['status' => $status, 'data' => $data])) !== false) {
            @rename($tmp, $file);
        }
        return ['status' => $status, 'data' => $data, 'stale' => false];
    }

    // CMS down or answering nonsense: fall back to the last good answer.
    if (is_array($cached)) {
        return ['status' => (int) $cached['status'], 'data' => $cached['data'], 'stale' => true];
    }

    return ['status' => 0, 'data' => null, 'stale' => false];
}

/** Every published article, newest first, or null when the CMS can't be reached. */
function news_all_articles(int $ttl): ?array
{
    $articles = [];

    for ($page = 1; $page <= 50; $page++) {
        $result = news_cms_get('/api/v1/news?page=' . $page . '&limit=' . NEWS_PAGE_SIZE, $ttl);
        $batch = $result['data']['news'] ?? null;
        if (!is_array($batch)) {
            return null;
        }
        foreach ($batch as $article) {
            if (is_array($article) && news_is_published($article)) {
                $articles[] = $article;
            }
        }
        if (count($batch) < NEWS_PAGE_SIZE) {
            break;
        }
    }

    return $articles;
}

function news_is_published(array $article): bool
{
    return preg_match('/^[a-f0-9]{24}$/i', (string) ($article['_id'] ?? '')) === 1
        && ($article['isActive'] ?? true) !== false;
}

// ── Article fields (mirror src/features/news/lib/news-seo.ts) ───────────────

function news_plain(string $html): string
{
    $text = html_entity_decode(strip_tags(str_replace('<', ' <', $html)), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    return trim((string) preg_replace('/\s+/u', ' ', $text));
}

function news_truncate(string $text, int $limit): string
{
    return mb_strlen($text, 'UTF-8') > $limit
        ? rtrim(mb_substr($text, 0, $limit - 1, 'UTF-8')) . '…'
        : $text;
}

function news_e(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function news_url(string $path): string
{
    return news_config()['siteUrl'] . $path;
}

function news_article_url(array $article): string
{
    return news_url('/news/' . $article['_id']);
}

function news_article_title(array $article): string
{
    return news_plain((string) ($article['title'] ?? ''));
}

function news_article_description(array $article): string
{
    return news_truncate(news_plain((string) ($article['content'] ?? '')), 160)
        ?: news_config()['newsDescription'];
}

/** The article's own image as an absolute URL, or null. */
function news_article_image(array $article): ?string
{
    $path = (string) ($article['images'][0]['url'] ?? '');
    if ($path === '') {
        return null;
    }
    return preg_match('#^https?://#i', $path) ? $path : news_config()['cmsOrigin'] . '/' . ltrim($path, '/');
}

function news_article_category(array $article): string
{
    return trim((string) ($article['newsTag'] ?? '')) ?: 'News';
}

function news_article_published(array $article): string
{
    return (string) ($article['createdAt'] ?? '');
}

function news_article_modified(array $article): string
{
    return (string) (($article['updatedAt'] ?? '') ?: news_article_published($article));
}

/** Answers with one of the build's HTML files and stops. */
function news_send_file(string $file, int $status, string $cacheControl = 'no-cache'): void
{
    http_response_code($status);
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: ' . $cacheControl);
    readfile(__DIR__ . '/' . $file);
    exit;
}
