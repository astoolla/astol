<?php
// تحميل ملفات CSS و JS للقالب
function astol_enqueue_scripts() {
    wp_enqueue_style('astol-style', get_stylesheet_uri());
    wp_enqueue_style('tailwind', 'https://cdn.tailwindcss.com');
    wp_enqueue_style('fontawesome', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css');
    wp_enqueue_style('cairo-font', 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
    wp_enqueue_script('astol-script', get_template_directory_uri() . '/script.js', array('jquery'), null, true);
}
add_action('wp_enqueue_scripts', 'astol_enqueue_scripts');

// إعداد متغير ajax_url في جافاسكريبت
add_action('wp_enqueue_scripts', function() {
    wp_localize_script('script', 'AstolAjax', array(
        'ajax_url' => admin_url('admin-ajax.php'),
    ));
});
