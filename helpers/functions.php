<?php

if(!defined('ABSPATH')){
	die();
}

if(!function_exists('prefy')){

	function prefy(){
		echo '<pre>';

		$args = func_get_args();

		if(is_array($args)){
			foreach($args as $arg){
				echo "<code>";
				var_dump($arg);
				echo "</code>";
			}
		}
		else{
			echo "<code>";
			var_dump($args);
			echo "</code>";
		}

		echo '</pre>';
	}
}