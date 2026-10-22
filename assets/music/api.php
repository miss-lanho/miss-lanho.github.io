<?php
ob_start();

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$tracks = [
    [
        'titleTracks' => 'Số 1 Thế Giới',
        'artist' => 'Huy Phát',
        'musicUrl' => 'https://cdn.jsdelivr.net/gh/leanhminh2104/leanhminh.io.vn@main/assets/music/so-1-the-gioi.mp3'
    ],
    [
        'titleTracks' => 'Tấm Lòng Cửu Long',
        'artist' => 'Ricky Star',
        'musicUrl' => 'https://cdn.jsdelivr.net/gh/leanhminh2104/leanhminh.io.vn@main/assets/music/tam-long-cuu-long.mp3'
    ]
];

$track = $tracks[array_rand($tracks)];

ob_clean();
echo json_encode([
    'error' => false,
    'message' => 'success',
    'titleTracks' => $track['titleTracks'],
    'artist' => $track['artist'],
    'musicUrl' => $track['musicUrl']
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
exit;
