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
    document.querySelector(".menu").innerHTML = "扫雷";
    document.querySelector(".start").innerHTML = "开始游戏";
    document.querySelector(".tutorial").innerHTML = "新手教程";
    document.querySelector(".leaderBoard").innerHTML = "排行榜";
    document.querySelector(".exit").innerHTML = "退出游戏";
    document.querySelector(".diffCon").innerHTML = "难度选择";
    document.querySelector(".easy").innerHTML = "简单";
    document.querySelector(".hard").innerHTML = "困难";
    let back = document.querySelectorAll(".back");
    for (let i = 0; i < back.length; i++){
        back[i].innerHTML = "返回";
    }
    document.querySelector(".tutoCon").innerHTML = "新手教程";
    document.querySelector(".tutor").innerHTML = 
    `<P>点击鼠标左键敲开方块</P>
    <p>如果触发了地雷，游戏结束</p>
    <p>如果出现数字，则意味着周围有对应数字的地雷数</p>
    <p>如果是空白，则周围无地雷</p>
    <p>鼠标右击标记你怀疑是地雷的方块</p>
    <p>再右击一次可以取消标记</p>
    <p>敲开所有非地雷方块，赢得最终胜利</p>`;
    document.querySelector(".leaderCon").innerHTML = "排行榜";
}

/**************************************
    方式名：englishRender()
    功能：渲染英文
**************************************/
Language.prototype.englishRender = function(){
    document.querySelector(".menu").innerHTML = "Minesweeper";
    document.querySelector(".start").innerHTML = "Start Game";
    document.querySelector(".tutorial").innerHTML = "Tutorial";
    document.querySelector(".leaderBoard").innerHTML = "Leaderboard";
    document.querySelector(".exit").innerHTML = "Exit";
    document.querySelector(".diffCon").innerHTML = "Difficulty";
    document.querySelector(".easy").innerHTML = "Easy";
    document.querySelector(".hard").innerHTML = "Hard";
    let back = document.querySelectorAll(".back");
    for (let i = 0; i < back.length; i++){
        back[i].innerHTML = "Back";
    }
    document.querySelector(".tutoCon").innerHTML = "Tutorial";
    document.querySelector(".tutor").innerHTML = 
    `<P>Click the left mouse button to crack open the square</P>
    <p>If a mine is triggered, the game is over</p>
    <p>If a number appears, it means that the number of mines with the corresponding number is around</p>
    <p>If blank, there are no mines around</p>
    <p>Right mouse click on the square that marks what you suspect is a mine</p>
    <p>Right click again to unmark</p>
    <p>Knock out all the non-mine squares to win the final victory</p>`;
    document.querySelector(".leaderCon").innerHTML = "Leaderboard";
}

/**************************************
    方式名：japaneseRender()
    功能：渲染日语
**************************************/
Language.prototype.japaneseRender = function(){
    document.querySelector(".menu").innerHTML = "マインスイーパー";
    document.querySelector(".start").innerHTML = "スタート";
    document.querySelector(".tutorial").innerHTML = "私は初心者";
    document.querySelector(".leaderBoard").innerHTML = "リーダーボード";
    document.querySelector(".exit").innerHTML = "ゲーム終了";
    document.querySelector(".diffCon").innerHTML = "難易度";
    document.querySelector(".easy").innerHTML = "簡単";
    document.querySelector(".hard").innerHTML = "難しい";
    let back = document.querySelectorAll(".back");
    for (let i = 0; i < back.length; i++){
        back[i].innerHTML = "戻る";
    }
    document.querySelector(".tutoCon").innerHTML = "チュートリアル";
    document.querySelector(".tutor").innerHTML = 
    `<P>マウスの左ボタンで四角を発動します</P>
    <p>地雷が発生したらゲームオーバー</p>
    <p>数字が表示された場合、その数字に対応する地雷の数が周辺にあることを意味します</p>
    <p>空白の場合、地雷はありません</p>
    <p>地雷と思われるマークをマウスの右ボタンでクリックする</p>
    <p>もう一度右クリックすると、マークが消えます</p>
    <p>地雷のないマスをすべてトリガーにして最終的に勝利する</p>`;
    document.querySelector(".leaderCon").innerHTML = "リーダーボード";
}