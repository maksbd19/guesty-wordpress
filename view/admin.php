<?php

if ( ! defined( 'ABSPATH' ) ) {
	die();
}

$api = guesty()->getApi();
?>

<div class="wrap">
    <h2>Guesty Api</h2>
    <p>Enter your Guesty API key and secret</p>

    <form class="guesty-api-form" action="<?php echo guesty()->location(); ?>" method="POST">
        <?php wp_nonce_field('save_guesty_api_token');?>
        <div class="form-group">
            <label for="guesty-page-id" class="control-label">Guesty display page</label>
            <div class="form-control">
                <?php wp_dropdown_pages(array( 'show_option_none' => 'Select Page', 'selected' => $api['page_id'], 'id' => 'guesty-page-id', 'name' => 'guesty-page-id'));?>
            </div>
        </div>
        <div class="form-group">
            <label for="guesty-api-key" class="control-label">Guesty API key</label>
            <div class="form-control">
                <input type="text" name="guesty-api-key" id="guesty-api-key" value="<?php echo $api['key']; ?>">
            </div>
        </div>
        <div class="form-group">
            <label for="guesty-api-secret" class="control-label">Guesty API secret</label>
            <div class="form-control">
                <input type="password" name="guesty-api-secret" id="guesty-api-secret"
                       value="<?php echo $api['secret']; ?>">
            </div>
        </div>
        <div class="form-group form-submit">
            <input type="submit" name="save-guesty-api" value="Save" class="button-primary">
        </div>
    </form>
</div>

<style>
    .guesty-api-form {
        padding: 20px 0;
    }

    .form-group {
        margin-bottom: 10px;
    }

    .control-label {
        width: 120px;
        display: inline-block;
        font-weight: bold;
        vertical-align: middle;
        margin-top: -8px;
    }

    .form-control {
        display: inline-block;
        width: 340px;
    }

    .form-control input {
        width: 100%;
    }
    .form-submit{
        padding-left: 126px;
    }
</style>