<?php

if(!defined('ABSPATH')){
	die();
}

?>

<script>
    jQuery(document).ready(function($){
        Guesty("#guesty-listing", "<?php echo $token;?>");
    });
</script>

<div id="guesty-listing"></div>

