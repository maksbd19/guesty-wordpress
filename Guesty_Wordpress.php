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


if ( ! defined( 'ABSPATH' ) ) {
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
		$this->initialize();
	}

	private function setup()
	{
		$this->base_path     = plugin_dir_path( __FILE__ );
		$this->base_url      = plugin_dir_url( __FILE__ );
		$this->base_location = admin_url( 'options-general.php?page=' . $this->menu_slug );
	}

	private function initialize()
	{
		add_action( "admin_menu", array( $this, "menu" ) );
		add_action( "admin_init", array( $this, "save_api" ) );
		add_action( "init", array( $this, "init" ) );
		add_action( "wp_enqueue_scripts", array( $this, "scripts" ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'custom_shortcode_scripts' ) );
		add_action( 'template_include', array( $this, 'template_include' ), 99 );
		add_shortcode( 'guesty-api', array( $this, 'shortcode' ) );

//		add_filter('pre_get_posts', array($this, 'pre_get_posts'));
		add_filter( 'rewrite_rules_array', array( $this, 'listing_permalink' ) );
	}

	public function init()
	{
		$this->add_query_vars();
	}

	public function add_query_vars()
	{
		add_filter( 'query_vars', array( $this, 'add_listing_query_var' ), 0, 1 );
	}

	public function add_listing_query_var( $vars )
	{
		$vars[] = 'listing';

		return $vars;
	}

	public function listing_permalink( $rules )
	{
		$api = $this->get_options();

		$my_em_rules = array();

		if ( isset( $api['page_id'] ) && $api['page_id'] !== "" && ( $page = get_post( $api['page_id'] ) ) ) {
			$page_id   = $api['page_id'];
			$page_slug = urldecode( preg_replace( '/\/$/', '', str_replace( trailingslashit( home_url() ), '', get_permalink( $page_id ) ) ) );
			$page_slug = ( ! empty( $page_slug ) ) ? untrailingslashit( $page_slug ) : $page_slug;

			if ( ! empty( $page_slug ) ) {
				$my_em_rules[ '^' . $page_slug . '/listing/([a-zA-Z0-9]+)/?$' ] = 'index.php?pagename=' . $page_slug . '&listing=$matches[1]';
			}
		}

		return $my_em_rules + $rules;
	}

	public function add_rewrite_rule()
	{
		$api = $this->get_options();

		if ( isset( $api['page_id'] ) && $api['page_id'] !== "" && ( $page = get_post( $api['page_id'] ) ) ) {
			$page_name = $page->post_name;
			add_rewrite_rule( '^/listing/([^/]+)/?$', 'index.php?pagename=' . $page_name . '&listing=$matches[1]', 'top' );
		}
	}

	public function pre_get_posts( $query )
	{
		if ( is_admin() || ! $query->is_main_query() ) {
			return $query;
		}

	}

	/**
	 * Call this method to get singleton
	 *
	 * @return Guesty_Wordpress
	 */
	public static function Instance()
	{
		static $instance = false;
		if ( $instance === false ) {
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
		) {
			return false;
		}

		$options = $this->get_options();

		if ( isset( $_POST['guesty-api-key'] ) ) {
			$options['key'] = esc_attr( $_POST['guesty-api-key'] );
		}
		if ( isset( $_POST['guesty-api-secret'] ) ) {
			$options['secret'] = esc_attr( $_POST['guesty-api-secret'] );
		}

		if ( isset( $_POST['guesty-page-id'] ) ) {
			$options['page_id'] = esc_attr( $_POST['guesty-page-id'] );
		}

		if ( isset( $_POST['guesty-listing-limit'] ) ) {
			$options['limit'] = esc_attr( $_POST['guesty-listing-limit'] );
		}

		$this->save_options( $options );

		$location = $this->location();

		global $wp_rewrite;
		$wp_rewrite->flush_rules();

		wp_safe_redirect( $location );

		die( 0 );
	}

	public function get_options()
	{
		$options = get_option( "_guesty_api_settings", array( 'key' => '', 'secret' => '' ) );

		$defaults = array(
			'key'     => '',
			'secret'  => '',
			'page_id' => '',
			'limit'   => '10'
		);

		if ( ! is_array( $options ) ) {
			$options = array();
		}

		$options = wp_parse_args( $options, $defaults );

		return $options;
	}

	private function save_options( $api )
	{
		return update_option( "_guesty_api_settings", $api );
	}

	public function location()
	{
		return $this->base_location;
	}

	public function custom_shortcode_scripts()
	{
		if ( ! $this->has_shortcode() ) {
			return false;
		}

		global $post;

		$options = $this->get_options();

		wp_enqueue_script( 'guesty-main' );
		wp_enqueue_style( 'guesty-styles' );
		wp_enqueue_style( 'font-awesome' );

		$guesty = array(
			'baseURI' => untrailingslashit( get_permalink( $post ) ),
			'limit' => $options['limit']
		);

		wp_localize_script( 'guesty-main', 'GUESTY_ARGS', $guesty );
	}

	public function has_shortcode()
	{
		global $post;

		return ( is_a( $post, 'WP_Post' ) && has_shortcode( $post->post_content, 'guesty-api' ) );
	}

	public function shortcode( $atts, $content = '' )
	{
		$a = shortcode_atts( array(
			'foo' => 'something',
			'bar' => 'something else',
		), $atts );


		$options = $this->get_options();

		$key    = $options['key'];
		$secret = $options['secret'];

		$token = 'Basic ' . base64_encode( "{$key}:{$secret}" );

		ob_start();

		include_once( $this->path( "view/view.php" ) );

		return ob_get_clean();

	}

	public function template_include( $template )
	{
		if ( is_page( 'portfolio' ) ) {
			$new_template = locate_template( array( 'portfolio-page-template.php' ) );
			if ( ! empty( $new_template ) ) {
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