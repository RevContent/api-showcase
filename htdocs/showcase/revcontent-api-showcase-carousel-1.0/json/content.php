<?php
/**
* Example API call in PHP for the RevContent API
*
* Got Questions? Email Us: support@revcontent.com
*
*/

    $revcontentAPI = 'https://trends.revcontent.com/api/v1/?'; 
    $api_key       = 'a3ef3561e4a67bc7ef7e0aff5a4889d19007c957';
    $pub_id        = 307;
    $widget_id     = 67;
    $domain        = "247sports.com";
    $count         = 20;
    $offset        = 0;
    $format        = "json";


    $url = $revcontentAPI . http_build_query(array(
        'api_key' => $api_key,
        'pub_id' => $pub_id,
        'widget_id' => $widget_id,
        'domain' => $domain,
        'count' => $count,
        'offset' => $offset,
        'format' => $format
    ));


    // Make the API call
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    $output = curl_exec($ch);
    curl_close($ch);

    // Decode and print the response
    $response = json_decode($output, true);

echo json_encode(array("items" => $response));

