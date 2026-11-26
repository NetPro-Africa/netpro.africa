<?php
// /news/rss.xml comes here (see .htaccess): the latest articles as an RSS
// feed, read live from the CMS (cached ten minutes). Feed readers, Google,
// Mailchimp's RSS-to-email and tools that post new articles to LinkedIn or X
// all read it. Every page links to it from its <head> (see index.html).

declare(strict_types=1);

require __DIR__ . '/news-lib.php';

const RSS_TTL = 600;
const RSS_ITEMS = 20;

$articles = news_all_articles(RSS_TTL);

if ($articles === null) {
    // Nothing to give yet; feed readers retry later.
    http_response_code(503);
    header('Retry-After: 600');
    header('Content-Type: text/plain; charset=utf-8');
    echo "The news feed is temporarily unavailable. Please try again in a few minutes.\n";
    exit;
}

usort($articles, static function (array $a, array $b): int {
    return strcmp(news_article_published($b), news_article_published($a));
});
$articles = array_slice($articles, 0, RSS_ITEMS);

$config = news_config();
$x = static function (string $value): string {
    return htmlspecialchars($value, ENT_XML1 | ENT_QUOTES, 'UTF-8');
};
$rfc822 = static function (string $iso): string {
    $time = strtotime($iso);
    return $time === false ? '' : gmdate('D, d M Y H:i:s', $time) . ' GMT';
};

$feedUrl = news_url('/news/rss.xml');
// ISO dates sort as text; RFC 822 ones don't, so pick the newest first.
$newest = '';
foreach ($articles as $article) {
    $newest = max($newest, news_article_modified($article));
}
$lastBuild = $newest !== '' ? $rfc822($newest) : gmdate('D, d M Y H:i:s') . ' GMT';

http_response_code(200);
header('Content-Type: application/rss+xml; charset=utf-8');
header('Cache-Control: public, max-age=600');

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">' . "\n";
echo "  <channel>\n";
echo '    <title>NetPro News</title>' . "\n";
echo '    <link>' . $x(news_url('/news')) . "</link>\n";
echo '    <description>' . $x($config['newsDescription']) . "</description>\n";
echo "    <language>en</language>\n";
echo '    <lastBuildDate>' . $x($lastBuild) . "</lastBuildDate>\n";
echo '    <atom:link href="' . $x($feedUrl) . '" rel="self" type="application/rss+xml" />' . "\n";
echo "    <image>\n";
echo '      <url>' . $x($config['logoUrl']) . "</url>\n";
echo "      <title>NetPro News</title>\n";
echo '      <link>' . $x(news_url('/news')) . "</link>\n";
echo "    </image>\n";

foreach ($articles as $article) {
    $url = news_article_url($article);
    $image = news_article_image($article);

    echo "    <item>\n";
    echo '      <title>' . $x(news_article_title($article)) . "</title>\n";
    echo '      <link>' . $x($url) . "</link>\n";
    echo '      <guid isPermaLink="true">' . $x($url) . "</guid>\n";
    echo '      <pubDate>' . $x($rfc822(news_article_published($article))) . "</pubDate>\n";
    echo '      <category>' . $x(news_article_category($article)) . "</category>\n";
    echo '      <description>' . $x(news_truncate(news_plain((string) ($article['content'] ?? '')), 300)) . "</description>\n";
    if ($image !== null) {
        echo '      <media:content url="' . $x($image) . '" medium="image" />' . "\n";
    }
    echo "    </item>\n";
}

echo "  </channel>\n";
echo "</rss>\n";
