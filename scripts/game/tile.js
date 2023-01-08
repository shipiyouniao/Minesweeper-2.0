/**************************************
    文件名：tile.js
    功能：该模块用于处理单个小方格相关内容
    版本：2.0(23.01.08)
**************************************/

/**************************************
    对象名：Tile
    参数：x: 横坐标, y: 纵坐标
**************************************/
function Tile(x, y){
    //方块的位置
    this.position = {
        positionX: x,
        positionY: y
    }
    //value为数字0~8时，指代周围有对应数字的雷数
    this.value = 0;
    //为true时是雷
    this.isMine = false;
    //方块目前状态，“nonTriggered”是未触发，“triggered”是已触发，“marked”是被标记
    this.recent = "nonTriggered";
}

/**************************************
    方式名：serialize()
    功能：序列化当前Tile对象
    返回值：包含value、isMine、recent的对象
**************************************/
Tile.prototype.serialize = function(){
    return {
        value: this.value,
        isMine: this.isMine,
        recent: this.recent
    };
}