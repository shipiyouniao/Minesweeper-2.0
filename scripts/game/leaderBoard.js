/**************************************
    文件名：leaderBoard.js
    功能：该模块用于处理排行榜相关内容
    版本：2.0(23.01.08)
**************************************/

/**************************************
    对象名：LeaderBoard
    参数：mode: 游戏难度
**************************************/
function LeaderBoard(mode){
    //获取难度
    this.mode = mode
    //设置排行榜缓存标签
    this.HighRankKey = 'MinesweeperRank';
    //从缓存中获取排行榜
    this.highRank = this.getRank();

}

/**************************************
    方式名：setHigh()
    参数：ID: 玩家昵称, time: 游戏时长字符串
    功能：设置最高分
**************************************/
LeaderBoard.prototype.setHigh = function(ID, time){
    let newHigh = {
        ID: ID,
        time: time
    }
    switch(this.mode){
        case "easy":
            this.rankCompare(this.highRank.easyRank, newHigh);
            break;
        case "hard":
            this.rankCompare(this.highRank.hardRank, newHigh);
            break;
        case "extra":
            this.rankCompare(this.highRank.extraRank, newHigh);
            break;
    }
}

/**************************************
    方式名：rankCompare()
    参数：rank: 对应难度排行榜数组, newHigh: 通关成绩对象
    功能：对比现有排行榜内容和传入成绩，如果破纪录则加入排行榜
**************************************/
LeaderBoard.prototype.rankCompare = function(rank, newHigh){
    let nH = newHigh.time.substring(0, newHigh.time.indexOf("h"));
    let nMin = newHigh.time.substring(newHigh.time.indexOf("h")+1, newHigh.time.indexOf("min"));
    let nS = newHigh.time.substring(newHigh.time.indexOf("min")+3, newHigh.time.indexOf("s"));
    let flag = false;
    if(rank.length == 0){
        rank.splice(0, 0, newHigh);
        flag = true;
    }else {
        for (let i = 0; i < rank.length; i++){
            let obj = rank[i];
            let h = parseInt(obj.time.substring(0, obj.time.indexOf("h")));
            let min = parseInt(obj.time.substring(obj.time.indexOf("h")+1, obj.time.indexOf("min")));
            let s = parseInt(obj.time.substring(obj.time.indexOf("min")+3, obj.time.indexOf("s")));
            if(nH < h){
                flag = true;
            }else if(nH == h && nMin < min){
                flag = true;
            }else if(nH == h && nMin == min && nS < s){
                flag = true;
            }
            if(flag){
                rank.splice(i, 0, newHigh);
                if(rank.length == 11){
                    rank.pop();
                }
                break;
            }
        }
        if(rank.length < 10 && !flag){
            rank.splice(rank.length, 0, newHigh);
            flag = true
        }
    }
    if(flag){
        this.setRank();
    }
}

/**************************************
    方式名：setRank()
    功能：将排行榜写入缓存
**************************************/
LeaderBoard.prototype.setRank = function(){
    window.localStorage.setItem(
        this.HighRankKey,
        JSON.stringify(this.highRank)
    )
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