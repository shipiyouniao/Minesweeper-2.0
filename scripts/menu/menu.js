/**************************************
    文件名：menu.js
    功能：该模块用于主菜单相关内容
    版本：2.0(23.01.08)
**************************************/

new Menu();

/**************************************
    对象名：Menu
**************************************/
function Menu(){
    //获取URL中“?”及后续部分
    let url = location.search;
    if (url.indexOf("?") != -1){
        //截取1到url.length的部分
        url = url.substring(1);
        //若传入了多个参数，以&分隔，此处将参数分解为数组内多个元素
        url = url.split('&');
    }
    
    //url第0项是语言
    this.lang = url[0].split('=')[1];

    //获取HTML语言列表
    this.langSlt = document.querySelector("footer .language");
    this.languages = ["中文", "English", "日本語"];
    //插入语言功能
    for (let lang of this.languages){
        const langLi = document.createElement("li");
        langLi.setAttribute("class", `lang ${lang}`);
        langLi.innerHTML = lang;
        this.langSlt.appendChild(langLi);
    } 
    this.listener = new Listener(this.lang);
    this.language = new Language(this.lang);
    this.language.langRender();
    this.leaderBoard = new LeaderBoard(this.lang);
    this.leaderBoard.rankRender("easy");
}