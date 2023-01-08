/**************************************
    文件名：manager.js
    功能：该模块用于处理游戏界面相关内容
    版本：2.0(23.01.08)
**************************************/

//新建Manager对象
new Manager();

/**************************************
    对象名：Manager
**************************************/
function Manager(){
    //获取URL中“?”及后续部分
    let url = location.search;
    if (url.indexOf("?") != -1){
        //截取1到url.length的部分
        url = url.substring(1);
        //若传入了多个参数，以&分隔，此处将参数分解为数组内多个元素
        url = url.split('&');
    }
    //参数第0项是语言参数lang，第一项是难度参数mode，以等号分开，取等号后内容
    this.lang = url[0].split('=')[1];
    this.mode = url[1].split('=')[1];

    //Language对象实例化
    this.language = new Language(this.lang);
    this.language.langRender();

    //Grid对象实例化
    this.grid = new Grid(this.lang, this.mode);
    this.grid.setMode();

    //Listener对象实例化
    this.listener = new Listener(this.lang, this.grid);
}