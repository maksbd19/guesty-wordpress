<?php
/**
 * @package guesty-wordpress
 * @version 1.0
 */
/*
Plugin Name: Guesty Wordpress
Plugin URI: http://wordpress.org/plugins/guesty-wordpress/
Description: Guesty integration in Wordpress
Author: Mahbub Alam
Version: 1.0
Author URI: http://makjoybd/
*/


if ( ! defined( 'ABSPATH' ) )
{
	die();
}

define( 'GUESTY_WORDPRESS', true );
define( 'GUESTY_WORDPRESS_VERSION', '1.0.0' );

require_once( plugin_dir_path( __FILE__ ) . '/helpers/functions.php' );

//  singleton

final class Guesty_Wordpress
{
	private $base_path = "";
	private $base_url = "";
	private $base_location = "";

	private $menu_slug = "guesty-wordpress";

	/**
	 * Make constructor private, so nobody can call "new Class".
	 */
	private function __construct()
	{
		$this->setup();
		$this->init();
	}

	private function setup()
	{
		$this->base_path     = plugin_dir_path( __FILE__ );
		$this->base_url      = plugin_dir_url( __FILE__ );
		$this->base_location = admin_url( 'options-general.php?page=' . $this->menu_slug );
	}

	private function init()
	{
		add_action( "admin_menu", array( $this, "menu" ) );
		add_action( "admin_init", array( $this, "save_api" ) );
		add_action( "wp_enqueue_scripts", array( $this, "scripts" ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'custom_shortcode_scripts' ) );
		add_action( 'template_include', array( $this, 'template_include' ), 99 );
		add_shortcode( 'guesty-api', array( $this, 'shortcode' ) );
	}

	/**
	 * Call this method to get singleton
	 *
	 * @return Guesty_Wordpress
	 */
	public static function Instance()
	{
		static $instance = false;
		if ( $instance === false )
		{
			// Late static binding (PHP 5.3+)
			$instance = new static();
		}

		return $instance;
	}

	public function scripts()
	{
		wp_register_script( 'guesty-main', guesty()->uri( 'assets/js/guesty.js' ), array( 'jquery' ), '1.0.0', true );
		wp_register_style( 'guesty-styles', guesty()->uri( 'assets/css/guesty.css' ), array(), '1.0.0' );
		wp_register_style( 'font-awesome', "https://use.fontawesome.com/releases/v5.4.1/css/all.css", array(), '5.4.1' );
	}

	public function uri( $trail = "" )
	{
		return untrailingslashit( $this->base_url ) . '/' . $trail;
	}

	public function menu()
	{
		add_options_page( "Guesty Wordpress", "Guesty Wordpress", "manage_options", $this->menu_slug, array(
			$this,
			"menu_page"
		) );
	}

	public function menu_page()
	{
		include_once( $this->path( "view/admin.php" ) );
	}

	public function path( $trail = "" )
	{
		return untrailingslashit( $this->base_path ) . '/' . $trail;
	}

	public function save_api()
	{
		if (
			! isset( $_POST ) || ! isset( $_POST['_wpnonce'] ) || ! wp_verify_nonce( $_POST['_wpnonce'], 'save_guesty_api_token' )
		)
		{
			return false;
		}

		$api = $this->getApi();

		if ( isset( $_POST['guesty-api-key'] ) )
		{
			$api['key'] = esc_attr( $_POST['guesty-api-key'] );
		}
		if ( isset( $_POST['guesty-api-secret'] ) )
		{
			$api['secret'] = esc_attr( $_POST['guesty-api-secret'] );
		}

		if ( isset( $_POST['guesty-page-id'] ) )
		{
			$api['page_id'] = esc_attr( $_POST['guesty-page-id'] );
		}

		$this->saveApi( $api );

		$location = $this->location();

		wp_safe_redirect( $location );

		die( 0 );
	}

	public function getApi()
	{
		$api = get_option( "_guesty_api_settings", array( 'key' => '', 'secret' => '' ) );

		$defaults = array(
			'key'     => '',
			'secret'  => '',
			'page_id' => ''
		);

		if ( ! is_array( $api ) )
		{
			$api = array();
		}

		$api = wp_parse_args( $api, $defaults );

		return $api;
	}

	private function saveApi( $api )
	{
		return update_option( "_guesty_api_settings", $api );
	}

	public function location()
	{
		return $this->base_location;
	}

	public function custom_shortcode_scripts()
	{
		global $post;
		if ( is_a( $post, 'WP_Post' ) && has_shortcode( $post->post_content, 'guesty-api' ) )
		{
			wp_enqueue_script( 'guesty-main' );
			wp_enqueue_style( 'guesty-styles' );
			wp_enqueue_style( 'font-awesome' );
		}
	}

	public function shortcode( $atts, $content = '' )
	{
		$a = shortcode_atts( array(
			'foo' => 'something',
			'bar' => 'something else',
		), $atts );

		$api    = $this->getApi();
		$key    = $api['key'];
		$secret = $api['secret'];

		$token = "Basic " . base64_encode( "{$key}:{$secret}" );

//		$listings = $this->guesty->getListing(5);

		ob_start();

//		if(is_array($listings) && !empty($listings)){
		include_once( $this->path( "view/view.php" ) );
//		}
//		else{
//			echo "No listing found";
//		}

		return ob_get_clean();

	}

	public function template_include( $template )
	{
		if ( is_page( 'portfolio' ) ) {
			$new_template = locate_template( array( 'portfolio-page-template.php' ) );
			if ( !empty( $new_template ) ) {
				return $new_template;
			}
		}

		return $template;
	}

	/**
	 * Make clone magic method private, so nobody can clone instance.
	 */
	private function __clone()
	{
	}

	/**
	 * Make sleep magic method private, so nobody can serialize instance.
	 */
	private function __sleep()
	{
	}

	/**
	 * Make wakeup magic method private, so nobody can unserialize instance.
	 */
	private function __wakeup()
	{
	}

}


function guesty()
{
	return Guesty_Wordpress::Instance();
}

guesty();