/**************************************
    文件名：leaderBoard.js
    功能：该模块用于处理主菜单排行榜相关内容
    版本：2.0(23.01.08)
**************************************/

/**************************************
    对象名：LeaderBoard
    参数：lang: 传入语言
**************************************/
function LeaderBoard(lang){
    //设置排行榜缓存标签
    this.HighRankKey = 'MinesweeperRank';
    //从缓存中获取排行榜
    this.highRank = this.getRank();
    //获取HTML中排行榜
    this.leadList = document.querySelector(".leadList");
    //获取排行榜下一页按钮
    this.next = document.querySelector(".next");
    //获取语言
    this.lang = lang;

    //在设置监听的匿名函数中，“this”不是指代的leaderBoard对象，必须单独获取
    let self = this;
    //下一页按钮事件监听
    this.next.addEventListener("click", function(){
        let nextDiff = self.next.innerHTML;
        if(nextDiff == "Easy" || nextDiff == "简单" || nextDiff == "簡単"){
            self.rankRender("easy");
        }else if(nextDiff == "Hard" || nextDiff == "困难" || nextDiff == "難しい"){
            self.rankRender("hard");
        }else if(nextDiff == "Extra"){
            self.rankRender("extra");
        }
    });
}

/**************************************
    方式名：getRank()
    功能：从缓存中获取排行榜
    返回值：返回排行榜对象
**************************************/
LeaderBoard.prototype.getRank = function(){
    let newRank = {
        easyRank: [],
        hardRank: [],
        extraRank: []
    }
    const rank = window.localStorage.getItem(this.HighRankKey);
    //如果缓存中没有排行榜，返回空的排行榜对象
    return rank ? JSON.parse(rank) : newRank;
}

/**************************************
    方式名：rankRender(difficulty)
    参数：difficulty: 游戏难度(easy为简单，hard为困难，extra为ex难度)
    功能：渲染排行榜
**************************************/
LeaderBoard.prototype.rankRender = function(difficulty){
    let rank = null;
    let diffCon = '';
    let nextCon = '';
    switch(difficulty){
        case "easy":
            rank = this.highRank.easyRank;
            switch(this.lang){
                case "zh_cn":
                    diffCon = "简单";
                    nextCon = "困难";
                    break;
                case "en":
                    diffCon = "Easy";
                    nextCon = "Hard";
                    break;
                case "jp":
                    diffCon = "簡単";
                    nextCon = "難しい";
                    break;
            }
            break;
        case "hard":
            rank = this.highRank.hardRank;
            switch(this.lang){
                case "zh_cn":
                    diffCon = "困难";
                    break;
                case "en":
                    diffCon = "Hard";
                    break;
                case "jp":
                    diffCon = "難しい";
                    break;
            }
            nextCon = "Extra";
            break;
        case "extra":
            rank = this.highRank.extraRank;
            switch(this.lang){
                case "zh_cn":
                    nextCon = "简单";
                    break;
                case "en":
                    nextCon = "Easy";
                    break;
                case "jp":
                    nextCon = "簡単";
                    break;
            }
            diffCon = "Extra";
            break;
    }
    this.leadList.innerHTML = '';
    for (let i = 0; i < rank.length; i++){
        let li = document.createElement("li");
        li.innerHTML = 
        `<div>${i+1}</div><div>${rank[i].ID}</div><div>${rank[i].time}</div>`;
        this.leadList.appendChild(li);
    }
    document.querySelector(".leaderDif").innerHTML = diffCon;
    this.next.innerHTML = nextCon;
}