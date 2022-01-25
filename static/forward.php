<?php

define("DEBUG", false);

makeRequest();

function makeRequest()
{
    $url = get($_GET, "url");

    $userAgent = get($_SERVER, "HTTP_USER_AGENT");

    $headers = [
        "User-Agent: $userAgent"
    ];

    $result = curlRequest("GET", $url, $headers, "", false, false);

    echo $result;
}

function curlRequest($action, $url, $headers = [], $body = "", $requestIsJson = true, $responseIsJson = true, $writeFunction = null)
{
    error_log("making curl request. url: " . $url);
    error_log("body: " . json_encode($body));

    $ch = curl_init($url);

    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $action);
    curl_setopt($ch, CURLOPT_ENCODING, "gzip");
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

    if ($writeFunction) {
        curl_setopt($ch, CURLOPT_WRITEFUNCTION, $writeFunction);
    } else {
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    }

    if ($requestIsJson) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }
    //regular post data
    else if ($body) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }

    if (getNested($GLOBALS, ["environment", "proxy", "ipAddress"])) {
        $loginpassw = getNested($GLOBALS, ["environment", "proxy", "login"]);
        $proxy_ip = getNested($GLOBALS, ["environment", "proxy", "ipAddress"]);
        $proxy_port = getNested($GLOBALS, ["environment", "proxy", "port"]);

        error_log("Using proxy $proxy_ip:$proxy_port");

        curl_setopt($ch, CURLOPT_PROXYPORT, $proxy_port);
        curl_setopt($ch, CURLOPT_PROXYTYPE, "HTTP");
        curl_setopt($ch, CURLOPT_PROXY, $proxy_ip);
        curl_setopt($ch, CURLOPT_PROXYUSERPWD, $loginpassw);
    }

    if (DEBUG) {
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
        curl_setopt($ch, CURLOPT_VERBOSE, 0);
    }

    curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_2_0);

    $responseHeaders = [];

    // this function is called by curl for each header received
    curl_setopt(
        $ch,
        CURLOPT_HEADERFUNCTION,
        function ($curl, $header) use (&$responseHeaders) {
            $len = strlen($header);
            $header = explode(':', $header, 2);
            if (count($header) < 2) // ignore invalid headers
                return $len;

            $responseHeaders[strtolower(trim($header[0]))][] = trim($header[1]);

            return $len;
        }
    );

    $result = curl_exec($ch);

    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    error_log("status code: $statusCode");
    error_log("response headers: " . print_r($responseHeaders, true));
    error_log("result: " . substr($result, 0, 500) . "...");

    if ($responseIsJson) {
        return json_decode($result, true);
    }

    return $result;
}

function get($array, $key, $default = null)
{
    return isset($array[$key]) ? $array[$key] : $default;
}

function getNested($array, $keys, $default = null)
{
    $result = $default;

    $currentArray = $array;

    for ($i = 0; $i < count($keys); $i++) {
        $key = $keys[$i];

        if (is_array($currentArray) && isset($currentArray[$key]) === false) {
            break;
        } else if (is_object($currentArray) && isset($currentArray->$key) === false) {
            break;
        } else if ($i < count($keys) - 1 && is_object($currentArray) === false && is_array($currentArray) === false) {
            break;
        }

        if ($i < count($keys) - 1) {
            if (is_array($currentArray)) {
                $currentArray = $currentArray[$key];
            } else {
                $currentArray = $currentArray->$key;
            }
        } else {
            if (is_array($currentArray)) {
                $result = $currentArray[$key];
            } else if (is_object($currentArray)) {
                $result = $currentArray->$key;
            }
        }
    }

    return $result;
}
