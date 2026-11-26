<?php
// /sitemap.xml comes here (see .htaccess): the site's pages plus every
// published article, read live from the CMS (cached ten minutes), so a new
// article is listed without a redeploy. If the CMS is down and nothing is
// cached, the sitemap the build wrote (sitemap-build.xml) is served instead.

declare(strict_types=1);

require __DIR__ . '/news-lib.php';

const SITEMAP_TTL = 600;

$articles = news_all_articles(SITEMAP_TTL);

if ($articles === null) {
    http_response_code(200);
    header('Content-Type: application/xml; charset=utf-8');
    header('Cache-Control: no-cache');
    readfile(__DIR__ . '/sitemap-build.xml');
    exit;
}

$x = static function (string $value): string {
    return htmlspecialchars($value, ENT_XML1 | ENT_QUOTES, 'UTF-8');
};

$newest = '';
foreach ($articles as $article) {
    $newest = max($newest, news_article_modified($article));
}

$entries = [];
// Only real dates: a lastmod that changes all the time teaches Google to
// ignore it. Fixed pages have none; the news page has the newest article's.
foreach (news_config()['pages'] as $page) {
    $entries[] = [$page['loc'], $page['isNews'] ? $newest : ''];
}
foreach ($articles as $article) {
    $entries[] = [news_article_url($article), news_article_modified($article)];
}

http_response_code(200);
header('Content-Type: application/xml; charset=utf-8');
header('Cache-Control: public, max-age=600');

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
foreach ($entries as [$loc, $lastmod]) {
    echo "  <url>\n    <loc>" . $x($loc) . '</loc>';
    if ($lastmod !== '') {
        echo "\n    <lastmod>" . $x($lastmod) . '</lastmod>';
    }
    echo "\n  </url>\n";
}
echo "</urlset>\n";
