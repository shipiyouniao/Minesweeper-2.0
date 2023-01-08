/**************************************
    文件名：listener.js
    功能：该模块用于处理事件监听相关内容
    版本：2.0(23.01.08)
**************************************/

/**************************************
    对象名：Listener
    参数：lang: 传入语言, grid: 传入grid对象
**************************************/
function Listener(lang, grid){
    //在设置监听的匿名函数中，“this”不是指代的Listener对象，必须单独获取
    let self = this;
    //获取语言
    this.lang = lang;
    //获取grid对象
    this.grid = grid;
    //获取所有返回按钮
    this.back = document.querySelectorAll(".back");
    //获取所有新游戏按钮
    this.newBtn = document.querySelectorAll(".new");
    //监听输入框旁的确认按钮
    this.confirm = document.querySelector(".confirm");

    //监听返回按钮点击事件
    for (let i = 0; i < this.back.length; i++){
        this.back[i].addEventListener("click", function(){
            window.open(`./menu.html?lang=${self.lang}`, "_self");
        });
    }

    //监听新游戏按钮点击事件
    for (let i = 0; i < this.newBtn.length; i++){
        this.newBtn[i].addEventListener("click", function(){
            self.grid.restart();
        })
    }

    //监听确认按钮点击事件
    this.confirm.addEventListener("click", function(){
        self.grid.rankConfirm();
    })

    //监听tile点击事件
    for (let i = 0; i < this.grid.hSize; i++){
        for (let j = 0; j < this.grid.wSize; j++){
            let theTile = document.querySelector(`.tile-${i}-${j}`);
            
            theTile.addEventListener("click", function (){
                if(self.grid.now == "Waiting"){
                    self.grid.start();
                }
                
                self.grid.click(i, j);
            });

            theTile.addEventListener("contextmenu", function (){
                self.grid.rightClick(i, j);
            });
        }
    }
}

//屏蔽右键菜单
document.oncontextmenu = function (event){
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