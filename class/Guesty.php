<?php

/**
 * Created by PhpStorm.
 * User: MahbubAlam
 * Date: 10/16/2018
 * Time: 1:52 PM
 */
class Guesty
{
	private $client = null;
	private $base = "https://api.guesty.com/api/v2/";

	public function __construct()
	{
		$params = array(
			'base_uri' => $this->base
		);

		$this->client = new \GuzzleHttp\Client($params);
	}

	private function getAuth(){

		$api = guesty()->getApi();

		if(!isset($api['key']) || $api['key'] === "" || $api['key'] === null){
			throw new Exception("Api key is missing");
		}
		else{
			$key = $api['key'];
		}

		if(!isset($api['secret']) || $api['secret'] === "" || $api['secret'] === null){
			throw new Exception("Api Secret is missing");
		}
		else{
			$secret = $api['secret'];
		}

		return array($key, $secret);
	}

	public function getListing($limit = 25){

		$query = array(
			"limit" => $limit
		);

		$params = array();

		$params['auth'] = $this->getAuth();

		if(!empty($query)){
			$params["query"] = $query;
		}

		try{
			$response = $this->client->request('GET', 'listings', $params );

			if($response->getStatusCode() === 200){
				$content = $response->getBody()->getContents();

				$data = json_decode($content, true);
				return $data['results'];
			}
		}
		catch(Exception $e){
			echo ($e->getMessage());
			return array();
		}

		return array();
	}

	public function url( $path = '' )
	{
		return $this->base . (strpos($path, '/') === 0 ? $path : '/' . $path);
	}
}