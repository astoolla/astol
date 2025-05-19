<?php
// Plugin Name: Astol Fleet Management
// Description: إدارة أسطول الشركة - إضافة مخصصة لووردبريس لتحكم ديناميكي في السائقين والمحطات والتوصيلات
// Version: 1.0
// Author: Your Name
// Text Domain: astol-fleet

if (!defined('ABSPATH')) exit;

// --- تسجيل Custom Post Types ---
function astol_register_custom_post_types() {
    // السائقين
    register_post_type('astol_driver', array(
        'labels' => array(
            'name' => 'السائقين',
            'singular_name' => 'سائق',
        ),
        'public' => false,
        'show_ui' => true,
        'menu_icon' => 'dashicons-id',
        'supports' => array('title'),
    ));
    // المحطات
    register_post_type('astol_station', array(
        'labels' => array(
            'name' => 'محطات الوقود',
            'singular_name' => 'محطة',
        ),
        'public' => false,
        'show_ui' => true,
        'menu_icon' => 'dashicons-location-alt',
        'supports' => array('title'),
    ));
    // التوصيلات
    register_post_type('astol_delivery', array(
        'labels' => array(
            'name' => 'التوصيلات',
            'singular_name' => 'توصيل',
        ),
        'public' => false,
        'show_ui' => true,
        'menu_icon' => 'dashicons-admin-site',
        'supports' => array('title'),
    ));
}
add_action('init', 'astol_register_custom_post_types');

// --- إضافة REST API endpoints أو AJAX لاحقاً ---

// --- إضافة حقول مخصصة للسائقين والمحطات والتوصيلات لاحقاً ---

// --- حقول مخصصة للسائقين ---
function astol_driver_meta_boxes() {
    add_meta_box('astol_driver_meta', 'بيانات السائق', 'astol_driver_meta_callback', 'astol_driver', 'normal', 'high');
}
add_action('add_meta_boxes', 'astol_driver_meta_boxes');

function astol_driver_meta_callback($post) {
    $fields = [
        'rt' => 'رت',
        'permit_num' => 'رقم التصريح',
        'driver_name' => 'اسم السائق',
        'phone_number' => 'رقم الهاتف',
        'truck_num' => 'رقم الشاحنة',
        'truck_type' => 'نوع الشاحنة',
        'truck_color' => 'لون الشاحنة',
        'product_type' => 'نوع المنتوج',
        'status' => 'الحالة',
        'issue_date' => 'تاريخ الإصدار',
        'expiry_date' => 'تاريخ الانتهاء',
        'trailer_num' => 'رقم المقطورة',
    ];
    echo '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem">';
    foreach($fields as $key=>$label) {
        $value = get_post_meta($post->ID, $key, true);
        echo "<div><label for='$key'><b>$label</b></label><input type='text' id='$key' name='$key' value='".esc_attr($value)."' style='width:100%'></div>";
    }
    echo '</div>';
}
function astol_driver_save_meta($post_id) {
    $fields = ['rt','permit_num','driver_name','phone_number','truck_num','truck_type','truck_color','product_type','status','issue_date','expiry_date','trailer_num'];
    foreach($fields as $key) {
        if(isset($_POST[$key])) {
            update_post_meta($post_id, $key, sanitize_text_field($_POST[$key]));
        }
    }
}
add_action('save_post_astol_driver', 'astol_driver_save_meta');

// --- حقول مخصصة للمحطات ---
function astol_station_meta_boxes() {
    add_meta_box('astol_station_meta', 'بيانات المحطة', 'astol_station_meta_callback', 'astol_station', 'normal', 'high');
}
add_action('add_meta_boxes', 'astol_station_meta_boxes');

function astol_station_meta_callback($post) {
    $fields = [
        'station_name' => 'اسم المحطة',
        'station_number' => 'رقم المحطة',
        'company' => 'الشركة',
        'address' => 'العنوان',
    ];
    echo '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem">';
    foreach($fields as $key=>$label) {
        $value = get_post_meta($post->ID, $key, true);
        echo "<div><label for='$key'><b>$label</b></label><input type='text' id='$key' name='$key' value='".esc_attr($value)."' style='width:100%'></div>";
    }
    echo '</div>';
}
function astol_station_save_meta($post_id) {
    $fields = ['station_name','station_number','company','address'];
    foreach($fields as $key) {
        if(isset($_POST[$key])) {
            update_post_meta($post_id, $key, sanitize_text_field($_POST[$key]));
        }
    }
}
add_action('save_post_astol_station', 'astol_station_save_meta');

// --- حقول مخصصة للتوصيلات ---
function astol_delivery_meta_boxes() {
    add_meta_box('astol_delivery_meta', 'بيانات التوصيل', 'astol_delivery_meta_callback', 'astol_delivery', 'normal', 'high');
}
add_action('add_meta_boxes', 'astol_delivery_meta_boxes');

function astol_delivery_meta_callback($post) {
    $fields = [
        'driver_id' => 'معرّف السائق',
        'station_id' => 'معرّف المحطة',
        'date' => 'تاريخ التوصيل',
        'fuel_type' => 'نوع الوقود',
        'quantity' => 'الكمية (لتر)',
        'notification_number' => 'رقم الإشعار',
    ];
    echo '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem">';
    foreach($fields as $key=>$label) {
        $value = get_post_meta($post->ID, $key, true);
        echo "<div><label for='$key'><b>$label</b></label><input type='text' id='$key' name='$key' value='".esc_attr($value)."' style='width:100%'></div>";
    }
    echo '</div>';
}
function astol_delivery_save_meta($post_id) {
    $fields = ['driver_id','station_id','date','fuel_type','quantity','notification_number'];
    foreach($fields as $key) {
        if(isset($_POST[$key])) {
            update_post_meta($post_id, $key, sanitize_text_field($_POST[$key]));
        }
    }
}
add_action('save_post_astol_delivery', 'astol_delivery_save_meta');

// --- AJAX: جلب قائمة السائقين ---
add_action('wp_ajax_astol_get_drivers', 'astol_get_drivers');
add_action('wp_ajax_nopriv_astol_get_drivers', 'astol_get_drivers');
function astol_get_drivers() {
    $args = array('post_type' => 'astol_driver', 'posts_per_page' => -1);
    $query = new WP_Query($args);
    $drivers = array();
    foreach($query->posts as $post) {
        $meta = array();
        foreach(['rt','permit_num','driver_name','phone_number','truck_num','truck_type','truck_color','product_type','status','issue_date','expiry_date','trailer_num'] as $key) {
            $meta[$key] = get_post_meta($post->ID, $key, true);
        }
        $drivers[] = array_merge(['id' => $post->ID, 'title' => $post->post_title], $meta);
    }
    wp_send_json_success($drivers);
}

// --- AJAX: إضافة سائق جديد ---
add_action('wp_ajax_astol_add_driver', 'astol_add_driver');
function astol_add_driver() {
    $fields = ['rt','permit_num','driver_name','phone_number','truck_num','truck_type','truck_color','product_type','status','issue_date','expiry_date','trailer_num'];
    $post_id = wp_insert_post([
        'post_type' => 'astol_driver',
        'post_title' => sanitize_text_field($_POST['driver_name'] ?? ''),
        'post_status' => 'publish',
    ]);
    if($post_id) {
        foreach($fields as $key) {
            if(isset($_POST[$key])) update_post_meta($post_id, $key, sanitize_text_field($_POST[$key]));
        }
        wp_send_json_success(['id' => $post_id]);
    } else {
        wp_send_json_error('خطأ في إضافة السائق');
    }
}

// --- AJAX: حذف سائق ---
add_action('wp_ajax_astol_delete_driver', 'astol_delete_driver');
function astol_delete_driver() {
    $id = intval($_POST['id'] ?? 0);
    if($id && get_post_type($id) === 'astol_driver') {
        wp_delete_post($id, true);
        wp_send_json_success();
    } else {
        wp_send_json_error('لم يتم العثور على السائق');
    }
}

// --- AJAX: تعديل بيانات سائق ---
add_action('wp_ajax_astol_update_driver', 'astol_update_driver');
function astol_update_driver() {
    $id = intval($_POST['id'] ?? 0);
    if($id && get_post_type($id) === 'astol_driver') {
        $fields = ['rt','permit_num','driver_name','phone_number','truck_num','truck_type','truck_color','product_type','status','issue_date','expiry_date','trailer_num'];
        foreach($fields as $key) {
            if(isset($_POST[$key])) update_post_meta($id, $key, sanitize_text_field($_POST[$key]));
        }
        if(isset($_POST['driver_name'])) {
            wp_update_post(['ID'=>$id, 'post_title'=>sanitize_text_field($_POST['driver_name'])]);
        }
        wp_send_json_success();
    } else {
        wp_send_json_error('لم يتم العثور على السائق');
    }
}

// --- AJAX: جلب قائمة المحطات ---
add_action('wp_ajax_astol_get_stations', 'astol_get_stations');
add_action('wp_ajax_nopriv_astol_get_stations', 'astol_get_stations');
function astol_get_stations() {
    $args = array('post_type' => 'astol_station', 'posts_per_page' => -1);
    $query = new WP_Query($args);
    $stations = array();
    foreach($query->posts as $post) {
        $meta = array();
        foreach(['station_name','station_number','company','address'] as $key) {
            $meta[$key] = get_post_meta($post->ID, $key, true);
        }
        $stations[] = array_merge(['id' => $post->ID, 'title' => $post->post_title], $meta);
    }
    wp_send_json_success($stations);
}

// --- AJAX: إضافة محطة جديدة ---
add_action('wp_ajax_astol_add_station', 'astol_add_station');
function astol_add_station() {
    $fields = ['station_name','station_number','company','address'];
    $post_id = wp_insert_post([
        'post_type' => 'astol_station',
        'post_title' => sanitize_text_field($_POST['station_name'] ?? ''),
        'post_status' => 'publish',
    ]);
    if($post_id) {
        foreach($fields as $key) {
            if(isset($_POST[$key])) update_post_meta($post_id, $key, sanitize_text_field($_POST[$key]));
        }
        wp_send_json_success(['id' => $post_id]);
    } else {
        wp_send_json_error('خطأ في إضافة المحطة');
    }
}

// --- AJAX: حذف محطة ---
add_action('wp_ajax_astol_delete_station', 'astol_delete_station');
function astol_delete_station() {
    $id = intval($_POST['id'] ?? 0);
    if($id && get_post_type($id) === 'astol_station') {
        wp_delete_post($id, true);
        wp_send_json_success();
    } else {
        wp_send_json_error('لم يتم العثور على المحطة');
    }
}

// --- AJAX: تعديل بيانات محطة ---
add_action('wp_ajax_astol_update_station', 'astol_update_station');
function astol_update_station() {
    $id = intval($_POST['id'] ?? 0);
    if($id && get_post_type($id) === 'astol_station') {
        $fields = ['station_name','station_number','company','address'];
        foreach($fields as $key) {
            if(isset($_POST[$key])) update_post_meta($id, $key, sanitize_text_field($_POST[$key]));
        }
        if(isset($_POST['station_name'])) {
            wp_update_post(['ID'=>$id, 'post_title'=>sanitize_text_field($_POST['station_name'])]);
        }
        wp_send_json_success();
    } else {
        wp_send_json_error('لم يتم العثور على المحطة');
    }
}

// --- AJAX: جلب قائمة التوصيلات ---
add_action('wp_ajax_astol_get_deliveries', 'astol_get_deliveries');
add_action('wp_ajax_nopriv_astol_get_deliveries', 'astol_get_deliveries');
function astol_get_deliveries() {
    $args = array('post_type' => 'astol_delivery', 'posts_per_page' => -1);
    $query = new WP_Query($args);
    $deliveries = array();
    foreach($query->posts as $post) {
        $meta = array();
        foreach(['driver_id','station_id','date','fuel_type','quantity','notification_number'] as $key) {
            $meta[$key] = get_post_meta($post->ID, $key, true);
        }
        $deliveries[] = array_merge(['id' => $post->ID, 'title' => $post->post_title], $meta);
    }
    wp_send_json_success($deliveries);
}

// --- AJAX: إضافة توصيل ---
add_action('wp_ajax_astol_add_delivery', 'astol_add_delivery');
function astol_add_delivery() {
    $fields = ['driver_id','station_id','date','fuel_type','quantity','notification_number'];
    $post_id = wp_insert_post([
        'post_type' => 'astol_delivery',
        'post_title' => sanitize_text_field($_POST['notification_number'] ?? ''),
        'post_status' => 'publish',
    ]);
    if($post_id) {
        foreach($fields as $key) {
            if(isset($_POST[$key])) update_post_meta($post_id, $key, sanitize_text_field($_POST[$key]));
        }
        wp_send_json_success(['id' => $post_id]);
    } else {
        wp_send_json_error('خطأ في إضافة التوصيل');
    }
}

// --- AJAX: حذف توصيل ---
add_action('wp_ajax_astol_delete_delivery', 'astol_delete_delivery');
function astol_delete_delivery() {
    $id = intval($_POST['id'] ?? 0);
    if($id && get_post_type($id) === 'astol_delivery') {
        wp_delete_post($id, true);
        wp_send_json_success();
    } else {
        wp_send_json_error('لم يتم العثور على التوصيل');
    }
}

// --- AJAX: تعديل بيانات توصيل ---
add_action('wp_ajax_astol_update_delivery', 'astol_update_delivery');
function astol_update_delivery() {
    $id = intval($_POST['id'] ?? 0);
    if($id && get_post_type($id) === 'astol_delivery') {
        $fields = ['driver_id','station_id','date','fuel_type','quantity','notification_number'];
        foreach($fields as $key) {
            if(isset($_POST[$key])) update_post_meta($id, $key, sanitize_text_field($_POST[$key]));
        }
        if(isset($_POST['notification_number'])) {
            wp_update_post(['ID'=>$id, 'post_title'=>sanitize_text_field($_POST['notification_number'])]);
        }
        wp_send_json_success();
    } else {
        wp_send_json_error('لم يتم العثور على التوصيل');
    }
}

// --- يمكن إضافة صفحات إعدادات أو صلاحيات خاصة لاحقاً ---
