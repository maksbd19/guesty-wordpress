<?php

if(!defined('ABSPATH')){
	die();
}

?>

<script>
    jQuery(document).ready(function($){
        Guesty("#guesty-listing", "<?php echo $token;?>", "<?php echo get_query_var('listing');?>");
    });
</script>

<div id="guesty-listing"></div>

