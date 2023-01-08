/**************************************
    文件名：grid.js
    功能：该模块用于处理游戏网格对象相关内容
    版本：2.0(23.01.08)
**************************************/

/**************************************
    对象名：Grid
    参数：lang: 语言, mode: 游戏难度
**************************************/
function Grid(lang, mode){
    //缓存标签
    this.gameKey = `${mode}State`;
    //存放tile对象数组
    this.grid = null;
    //方格大小
    this.size = "54px";
    //字体大小
    this.fontSize = "25px";
    //横向方格数
    this.wSize = 9;
    //纵向方格数
    this.hSize = 9;
    //游戏难度
    this.mode = mode;
    //地雷数量
    this.mine = 10;
    //当前状态
    this.now = "Waiting";
    //判断是否是第一次点击
    this.first = true;
    //实例化时间对象
    this.time = new Time(0, 0, 0);
    //时间计时器
    this.t = null;
    //非地雷方块数量
    this.emptyNum = null;
    //获取语言
    this.lang = lang;
    //获取HTML中grid元素
    this.gridBlk = document.querySelector(".grid");
    //排行榜对象实例化
    this.leaderBoard = new LeaderBoard(mode);
}

/**************************************
    方式名：setMode()
    功能：按照难度初始化grid
**************************************/
Grid.prototype.setMode = function(){
    switch(this.mode){
        case "easy":
            this.mine = 10;
            this.wSize = 9;
            this.hSize = 9;
            break;
        case "hard":
            this.mine = 40;
            this.wSize = 16;
            this.hSize = 16;
            break;
        case "extra":
            this.mine = 99;
            this.wSize = 30;
            this.hSize = 16;
            break;
    }
    this.createGrid();
}

/**************************************
    方式名：createGrid()
    功能：创建HTML中grid网格，初步渲染游戏界面
**************************************/
Grid.prototype.createGrid = function(){
    this.gridBlk.innerHTML = '';
    if(this.mode == "extra") {
        this.gridBlk.style.width = "1050px";
        this.gridBlk.style.marginLeft = "calc((100vw - 1350px)/2)";
    }else {
        this.gridBlk.style.width = "630px";
        this.gridBlk.style.marginLeft = "calc((100vw - 930px)/2)";
    }
    for (let i = 0; i < this.hSize; i++){
        let newLine = document.createElement("div");
        newLine.setAttribute("class", `line-${i} tileLine`);
        if(this.mode == "extra") {
            newLine.style.width = "1050px";
        }else {
            newLine.style.width = "630px";
        }

        for (let j = 0; j < this.wSize; j++){
            let newTile = document.createElement("div");
            newTile.setAttribute("class", `nonTriggered tile tile-${i}-${j}`);
            switch(this.mode){
                case "easy":
                    this.size = "54px";
                    this.fontSize = "25px";
                    break;
                case "hard":
                    this.size = "30px";
                    this.fontSize = "14px";
                    break;
                case "extra":
                    this.size = "30px";
                    this.fontSize = "14px";
                    break;
            }
            newLine.appendChild(newTile);
            newTile.style.width = this.size;
            newTile.style.height = this.size;
        }
        this.gridBlk.appendChild(newLine);
    }

    //读取缓存，如果缓存里有未完成的游戏，则恢复游戏
    let recentGame = this.getGame();
    if(recentGame){
        this.recover(recentGame.grid, recentGame.time);
    }
}

/**************************************
    方式名：createGridObj()
    功能：初始化Grid数组
**************************************/
Grid.prototype.createGridObj = function(){
    for (let i = 0; i < this.hSize; i++){
        this.grid.push([]);
        for (let j = 0; j < this.wSize; j++){
            this.grid[i].push(new Tile(i, j));
        }
    }
}

/**************************************
    方式名：setValue()
    功能：生成地雷，设置tile的value数值
**************************************/
Grid.prototype.setValue = function(){
    //生成地雷算法
    mineNum = this.mine;
    for (let i = 0; i < this.hSize; i++){
        for (let j = 0; j < this.wSize; j++){
            //随机0~9的整数
            let num = Math.floor(Math.random() * 10);
            //数字为0,4,9时该方块为雷
            if ((num == 0 || num == 4) && mineNum != 0){
                this.grid[i][j].isMine = true;
                let theTile = document.querySelector(`.tile-${i}-${j}`);
                theTile.setAttribute("class", `nonTriggered tile tile-${i}-${j} mine`);
                mineNum--;
            }else if(mineNum == 0){
                break;
            }
        }
    }
    if(mineNum != 0) this.setValue();

    //计算周围雷数算法
    for (let i = 0; i < this.hSize; i++){
        for (let j = 0; j < this.wSize; j++){   
            if(this.grid[i][j].isMine){
                if (i != 0){
                    if (j != 0) this.grid[i-1][j-1].value++;
                    this.grid[i-1][j].value++;
                    if (j != this.wSize-1) this.grid[i-1][j+1].value++;
                }
                if (i != this.hSize-1){
                    if (j != 0) this.grid[i+1][j-1].value++;
                    this.grid[i+1][j].value++;
                    if (j != this.wSize-1) this.grid[i+1][j+1].value++;
                }
                if (j != 0) this.grid[i][j-1].value++;
                if (j != this.wSize-1) this.grid[i][j+1].value++;
            }
        }
    }

    //设置每一个tile对象内和class中value值算法
    for (let i = 0; i < this.hSize; i++){
        for (let j = 0; j < this.wSize; j++){
            let tileObj = this.grid[i][j];
            let theTile = document.querySelector(`.tile-${i}-${j}`);
            theTile.innerHTML = '';
            
            //添加内置图像
            let img = document.createElement("img");
            img.setAttribute("src","./image/flag.png");
            img.style.width = this.size;
            img.style.height = this.size;
            theTile.appendChild(img);

            //添加value数字
            if (tileObj.value != 0){
                let valueCon = document.createElement("p");
                valueCon.innerHTML = tileObj.value;
                valueCon.style.width = this.size;
                valueCon.style.height = this.size;
                valueCon.style.fontSize = this.fontSize;
                valueCon.style.lineHeight = this.size;
                valueCon.style.bottom = `calc(${this.size}/2)`;
                theTile.appendChild(valueCon);
            }

            if (!this.grid[i][j].isMine) theTile.setAttribute("class", `nonTriggered tile tile-${i}-${j} value-${tileObj.value}`);
            else theTile.setAttribute("class", `nonTriggered tile tile-${i}-${j} mine value-${tileObj.value}`);
        }
    }
}

/**************************************
    方式名：start()
    功能：开始一局新游戏
**************************************/
Grid.prototype.start = function(){
    //停止计时器
    if (this.t){
        clearInterval(this.t);
    }
    this.now = "Doing";
    this.grid = [];
    this.time = new Time(0, 0, 0);
    this.emptyNum = this.hSize * this.wSize - this.mine;
    this.createGridObj();
    this.setValue();
    this.timeStart();
}

/**************************************
    方式名：click()
    参数：i: 横坐标, j: 纵坐标
    功能：左键单击tile判断
**************************************/
Grid.prototype.click = function(i, j){
    let theTile = document.querySelector(`.tile-${i}-${j}`);

    //若第一次触发的不是空白，游戏重置
    if(this.first){
        while(this.grid[i][j].value != 0 || this.grid[i][j].isMine){
            this.start();
        }
        this.first = false;
    }

    if(this.grid[i][j].recent == "nonTriggered"){
        this.grid[i][j].recent = "triggered";
        let tileCon = theTile.getAttribute("class").split(" ");
        tileCon.splice(tileCon.indexOf("nonTriggered"), 1);
        tileCon.push("triggered");
        tileCon = tileCon.join(" ");
        theTile.setAttribute("class", tileCon);

        if(this.grid[i][j].isMine){
            let img = document.querySelector(`.tile-${i}-${j} img`);
            img.setAttribute("src", "./image/bomb.png");
            //停止计时器
            clearInterval(this.t);
            this.now = "Failed";
        }else if(!this.grid[i][j].isMine){
            this.emptyNum--;
        }

        if(this.grid[i][j].value == 0 && !this.grid[i][j].isMine) this.checkEmpty(i, j);

        if(this.emptyNum == 0){
            //停止计时器
            clearInterval(this.t);
            this.now = "Win";
        }

        this.maskBlk();
    }
}

/**************************************
    方式名：checkEmpty()
    参数：i: 横坐标, j: 纵坐标
    功能：检测单击方块周围是否为非雷方块
**************************************/
Grid.prototype.checkEmpty = function(i, j){
    if (i != 0){
        if (j != 0 && !this.grid[i-1][j-1].isMine && this.grid[i-1][j-1].recent == "nonTriggered") this.click(i-1, j-1);
        if (!this.grid[i-1][j].isMine && this.grid[i-1][j].recent == "nonTriggered") this.click(i-1, j);
        if (j != this.wSize-1 && !this.grid[i-1][j+1].isMine && this.grid[i-1][j+1].recent == "nonTriggered") this.click(i-1, j+1);
    }
    if (i != this.hSize-1){
        if (j != 0 && !this.grid[i+1][j-1].isMine && this.grid[i+1][j-1].recent == "nonTriggered") this.click(i+1, j-1);
        if (!this.grid[i+1][j].isMine && this.grid[i+1][j].recent == "nonTriggered") this.click(i+1, j);
        if (j != this.wSize-1 && !this.grid[i+1][j+1].isMine && this.grid[i+1][j+1].recent == "nonTriggered") this.click(i+1, j+1);
    }
    if (j != 0 && !this.grid[i][j-1].isMine && this.grid[i][j-1].recent == "nonTriggered") this.click(i, j-1);
    if (j != this.wSize-1 && !this.grid[i][j+1].isMine && this.grid[i][j+1].recent == "nonTriggered") this.click(i, j+1);
}

/**************************************
    方式名：rightClick()
    参数：i: 横坐标, j: 纵坐标
    功能：右键单击tile判断
**************************************/
Grid.prototype.rightClick = function(i, j){
    let theTile = document.querySelector(`.tile-${i}-${j}`);

    if(this.grid[i][j].recent == "nonTriggered"){
        this.grid[i][j].recent = "marked";

        let tileCon = theTile.getAttribute("class").split(" ");
        tileCon.splice(tileCon.indexOf("nonTriggered"), 1);
        tileCon.push("marked");
        tileCon = tileCon.join(" ");
        theTile.setAttribute("class", tileCon);
    }else if(this.grid[i][j].recent == "marked"){
        this.grid[i][j].recent = "nonTriggered";

        let tileCon = theTile.getAttribute("class").split(" ");
        tileCon.splice(tileCon.indexOf("marked"), 1);
        tileCon.push("nonTriggered");
        tileCon = tileCon.join(" ");
        theTile.setAttribute("class", tileCon);
    }
}

/**************************************
    方式名：timeStart()
    功能：开始计时
**************************************/
Grid.prototype.timeStart = function(){
    let timeCon = document.querySelector(".timeCon");
    let self = this;
    if (this.now = "Doing"){
        this.t = setInterval(function(){
            self.time.time.s++;
            if (self.time.time.s == 60){
                self.time.time.min++;
                self.time.time.s = 0;
            }
            if (self.time.time.min == 60){
                self.time.time.h++;
                self.time.time.min = 0;
            }

            timeCon.innerHTML = self.time.getTime();
            
            //每一秒保存一次游戏
            self.setGame();
        }, 1000);
    }
}

/**************************************
    方式名：restart()
    功能：恢复初始状态
**************************************/
Grid.prototype.restart = function(){
    //隐藏结束界面蒙版
    document.querySelector(".mask").style.display = "none";
    //恢复第一次点击
    this.first = true;
    //停止计时器
    clearInterval(this.t);
    //恢复所有tile的class
    for (let i = 0; i < this.hSize; i++){
        for (let j = 0; j < this.wSize; j++){
            let theTile = document.querySelector(`.tile-${i}-${j}`);
            theTile.setAttribute("class", `nonTriggered tile tile-${i}-${j}`);
        }
    }
    //初始化时间
    let timeCon = document.querySelector(".timeCon");
    timeCon.innerHTML = "0h0min0s";
    //初始化当前状态
    this.now = "Waiting";
}

/**************************************
    方式名：maskBlk()
    功能：判断游戏是否结束，渲染结束界面蒙版
**************************************/
Grid.prototype.maskBlk = function(){
    if(this.now == "Win"){
        window.localStorage.removeItem(this.gameKey);
        document.querySelector(".mask").style.display = "block";
        switch (this.lang){
            case "zh_cn":
                document.querySelector(".content").innerHTML = "你赢了！";
                document.querySelector(".enterName input").setAttribute("placeholder", "请输入您的昵称");
                break;
            case "en":
                document.querySelector(".content").innerHTML = "You win!";
                document.querySelector(".enterName input").setAttribute("placeholder", "Please enter your nickname");
                break;
            case "jp":
                document.querySelector(".content").innerHTML = "ユーウィン！";
                document.querySelector(".enterName input").setAttribute("placeholder", "ニックネームを入力してください");
                break;
        }
        document.querySelector(".enterName").style.display = "flex";
    }else if(this.now == "Failed"){
        window.localStorage.removeItem(this.gameKey);
        document.querySelector(".mask").style.display = "block";
        switch (this.lang){
            case "zh_cn":
                document.querySelector(".content").innerHTML = "你输了！";
                break;
            case "en":
                document.querySelector(".content").innerHTML = "You failed!";
                break;
            case "jp":
                document.querySelector(".content").innerHTML = "残念！";
                break;
        }
        document.querySelector(".enterName").style.display = "none";
    }
}

/**************************************
    方式名：rankConfirm()
    功能：处理胜利界面确认按钮动作
**************************************/
Grid.prototype.rankConfirm = function(){
    const ID = document.querySelector("input").value;
    const time = this.time.getTime();
    this.leaderBoard.setHigh(ID, time);
    document.querySelector(".enterName").style.display = "none";
}

/**************************************
    方式名：serialize()
    功能：grid序列化
    返回值：序列化后的grid以及游戏时间的对象
**************************************/
Grid.prototype.serialize = function(){
    const grid = [];
    for (let i = 0; i < this.hSize; i++){
        grid.push([]);
        for (let j = 0; j < this.wSize; j++){
            grid[i].push(this.grid[i][j].serialize());
        }
    }

    return {
        grid: grid,
        time: {
            h: this.time.time.h,
            min: this.time.time.min,
            s: this.time.time.s
        }
    };
}

/**************************************
    方式名：serialize()
    参数：grid: 序列化的grid, time: 游戏时间
    功能：游戏内容反序列化
**************************************/
Grid.prototype.recover = function(grid, time){
    this.first = false;
    this.now = "Doing";
    this.time.time.h = time.h;
    this.time.time.min = time.min;
    this.time.time.s = time.s;
    this.timeStart();
    this.grid = [];
    for (let i = 0; i < this.hSize; i++){
        this.grid.push([]);
        for (let j = 0; j < this.wSize; j++){
            let sTile = grid[i][j];
            let newTile = new Tile(i, j);
            newTile.value = sTile.value;
            newTile.isMine = sTile.isMine;
            newTile.recent = sTile.recent;
            this.grid[i].push(newTile);
        }
    }
    this.recoverValue();
}

/**************************************
    方式名：recoverValue()
    功能：反序列化后重新渲染界面
**************************************/
Grid.prototype.recoverValue = function(){
    this.emptyNum = this.hSize * this.wSize - this.mine;
    for (let i = 0; i < this.hSize; i++){
        for (let j = 0; j < this.wSize; j++){
            let tileObj = this.grid[i][j];
            let theTile = document.querySelector(`.tile-${i}-${j}`);
            let tileCon = ["tile", `tile-${i}-${j}`];
            if(tileObj.isMine) tileCon.push("mine");
            tileCon.push(tileObj.recent);
            if(tileObj.recent == "triggered") this.emptyNum--;
            tileCon.push(`value-${tileObj.value}`);
            tileCon = tileCon.join(" ");
            theTile.setAttribute("class", tileCon);

            //添加内置图像
            let img = document.createElement("img");
            img.setAttribute("src","./image/flag.png");
            img.style.width = this.size;
            img.style.height = this.size;
            theTile.appendChild(img);

            //添加value数字
            if (tileObj.value != 0){
                let valueCon = document.createElement("p");
                valueCon.innerHTML = tileObj.value;
                valueCon.style.width = this.size;
                valueCon.style.height = this.size;
                valueCon.style.fontSize = this.fontSize;
                valueCon.style.lineHeight = this.size;
                valueCon.style.bottom = `calc(${this.size}/2)`;
                theTile.appendChild(valueCon);
            }
        }
    }
}

/**************************************
    方式名：setGame()
    功能：游戏记录写入缓存
**************************************/
Grid.prototype.setGame = function(){
    window.localStorage.setItem(
        this.gameKey,
        JSON.stringify(this.serialize())
    );
}

/**************************************
    方式名：getGame()
    功能：从缓存中读取游戏记录
    返回值：若缓存中存在游戏记录，返回游戏记录，否则返回null
**************************************/
Grid.prototype.getGame = function(){
    const state = window.localStorage.getItem(this.gameKey);
    return state ? JSON.parse(state) : null;
}