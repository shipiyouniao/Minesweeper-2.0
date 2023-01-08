/**************************************
    文件名：listener.js
    功能：该模块用于处理事件监听相关内容
    版本：2.0(23.01.08)
**************************************/

/**************************************
    对象名：Listener
    参数：lang: 传入语言
**************************************/
function Listener(lang) {
    //获取HTML中的Language按钮
    this.langSltBtn = document.querySelector(".langSltBtn");
    //获取语言按钮列表
    this.langSlt = document.querySelector("footer .language");
    //获取所有的语言按钮
    this.langs = document.querySelectorAll(".lang");
    //获取难度菜单
    this.difficulty = document.querySelector(".difficulty");
    //获取主菜单列表按钮
    this.selection = document.querySelectorAll(".menuList button");
    //获取难度列表按钮
    this.diffBtn = document.querySelectorAll(".difficulty button");
    //获取新手教程界面
    this.tutorial = document.querySelector(".tutorialBlk");
    //获取新手教程界面返回按钮
    this.tutoBack = document.querySelector(".tutorialBlk .back");
    //获取排行榜界面
    this.leaderBlk = document.querySelector(".leaderBlk");
    //获取排行榜界面返回按钮
    this.leadBack = document.querySelector(".leaderBlk .back");
    //获取语言
    this.lang = lang;

    //在设置监听的匿名函数中，“this”不是指代的Listener对象，必须单独获取
    let self = this;
    //语言按钮点击事件
    let flag = false;
    this.langSltBtn.addEventListener("click", function (){
        flag = !flag;
        self.langSlt.style.display = (flag) ? "flex" : "none";
    });

    //主菜单列表按钮点击事件
    for (let i = 0; i < this.selection.length; i++){
        this.selection[i].addEventListener("click", function (){
            self.btnClick(i);
        })
    }

    //难度列表按钮点击事件
    for (let i = 0; i < this.diffBtn.length; i++){
        this.diffBtn[i].addEventListener("click", function (){
            self.diffBtnClick(i);
        })
    }

    //新手教程界面返回按钮点击事件
    this.tutoBack.addEventListener("click", function (){
        self.tutorial.style.display = "none";
    });

    //排行榜界面返回按钮点击事件
    this.leadBack.addEventListener("click", function (){
        self.leaderBlk.style.display = "none";
    });

    //切换语言
    for (let i = 0; i < this.langs.length; i++) {
        this.langs[i].addEventListener("click", function (){
            let lang = self.langs[i].innerHTML;
            let langCode = '';
            switch(lang){
                case "中文":
                    langCode = "zh_cn";
                    break;
                case "English":
                    langCode = "en";
                    break;
                case "日本語":
                    langCode = "jp";
                    break;
            }
            window.open(`./menu.html?lang=${langCode}`,"_self");
        });
    }
}

/**************************************
    方式名：btnClick()
    参数：i: 第i个按钮
    功能：处理主菜单按钮事件
**************************************/
Listener.prototype.btnClick = function(i){
    switch (i){
        case 0:
            this.difficulty.style.display = "block";
            break;
        case 1:
            this.tutorial.style.display = "block";
            break;
        case 2:
            this.leaderBlk.style.display = "block";
            break;
        case 3:
            window.location.href = "about:blank";
            window.close();
            break;
    }
}

/**************************************
    方式名：diffBtnClick()
    参数：i: 第i个按钮
    功能：处理难度选单按钮事件
**************************************/
Listener.prototype.diffBtnClick = function(i){
    switch (i){
        case 0:
            window.open(`./game.html?lang=${this.lang}&mode=easy`, "_self");
            break;
        case 1:
            window.open(`./game.html?lang=${this.lang}&mode=hard`, "_self");
            break;
        case 2:
            window.open(`./game.html?lang=${this.lang}&mode=extra`, "_self");
            break;
        case 3:
            this.difficulty.style.display = "none";
            break;
    }
}

//屏蔽右键菜单
document.oncontextmenu = function(event){
    if(window.event){
        event = window.event;
    }try{
        var the = event.srcElement;
    if (!((the.tagName == "INPUT" && the.type.toLowerCase() == "text") || the.tagName == "TEXTAREA")){
        return false;
    }
        return true;
    }catch (e){
        return false;
    }
}