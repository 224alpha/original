$(document).ready(function(){

if($(window).width() > 992){
    //item slides slick
    $('.homepage-item-list-1').slick({
        slide:'div',
        autoplay: true,
        prevArrow: $('.left-side2'),
        nextArrow: $('.right-side2'),
        slidesToShow: 4,
        lidesToScroll: 1,
        
        
    });
    var item_section_height = $('.few_item_slider').height()/2;
    console.log(item_section_height);
    console.log($('.few_item_slider').height());
    $('.width_of_item-section').css({"top":item_section_height,"transform": "translateY(-50%)"});

}


//media query
if($(window).width() <= 992 && $(window).width() > 600){

        //item slides slick
        $('.homepage-item-list-1').slick({
            infinte:true,
            slidesToShow: 3,
            lidesToScroll: 1,
            autoplay: true,
            autoplaySpeed: 2000,
            prevArrow: $('.left-side2'),
            nextArrow: $('.right-side2'),
            
        });



    }






//media query
if($(window).width() <=600){


        //item slides slick
        $('.homepage-item-list-1').slick({
            infinte:true,
            slidesToShow: 2,
            lidesToScroll: 1,
            autoplay: true,
            autoplaySpeed: 2000,
            prevArrow: $('.left-side2'),
            nextArrow: $('.right-side2'),
            
        });



}
















});
       


