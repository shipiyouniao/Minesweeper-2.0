/**************************************
    文件名：language.js
    功能：该模块用于处理主菜单语言相关内容
    版本：2.0(23.01.08)
**************************************/

/**************************************
    对象名：Language
    参数：lang: 传入语言(zh_cn为中文，en为英文，jp为日文)
**************************************/
function Language(lang){
    this.lang = lang;
}

/**************************************
    方式名：langRender()
    功能：根据语种渲染对应的语言
**************************************/
Language.prototype.langRender = function(){
    switch (this.lang){
        case "zh_cn":
            this.chineseRender();
            break;
        case "en":
            this.englishRender();
            break;
        case "jp":
            this.japaneseRender();
            break;
    }
}

/**************************************
    方式名：chineseRender()
    功能：渲染中文
**************************************/
Language.prototype.chineseRender = function(){
    document.querySelector(".timeTitle").innerHTML = "游戏时长";
    document.querySelector(".confirm").innerHTML = "确认";
    let newBtn = document.querySelectorAll(".new");
    for (let i = 0; i < newBtn.length; i++){
        newBtn[i].innerHTML = "重开一局";
    }
    let back = document.querySelectorAll(".back");
    for (let i = 0; i < back.length; i++){
        back[i].innerHTML = "返回";
    }
}

/**************************************
    方式名：englishRender()
    功能：渲染英文
**************************************/
Language.prototype.englishRender = function(){
    document.querySelector(".timeTitle").innerHTML = "Time";
    document.querySelector(".confirm").innerHTML = "Confirm";
    let newBtn = document.querySelectorAll(".new");
    for (let i = 0; i < newBtn.length; i++){
        newBtn[i].innerHTML = "New Game";
    }
    let back = document.querySelectorAll(".back");
    for (let i = 0; i < back.length; i++){
        back[i].innerHTML = "Back";
    }
}

/**************************************
    方式名：japaneseRender()
    功能：渲染日语
**************************************/
Language.prototype.japaneseRender = function(){
    document.querySelector(".timeTitle").innerHTML = "プレイ時間";
    document.querySelector(".confirm").innerHTML = "確認する";
    let newBtn = document.querySelectorAll(".new");
    for (let i = 0; i < newBtn.length; i++){
        newBtn[i].innerHTML = "ニューゲーム";
    }
    let back = document.querySelectorAll(".back");
    for (let i = 0; i < back.length; i++){
        back[i].innerHTML = "戻る";
    }
}