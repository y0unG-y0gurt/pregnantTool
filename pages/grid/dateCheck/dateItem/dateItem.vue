<template>
    <view>
        <view class="uni-list  mylist">
        	<view class="uni-list-cell">
        		<view class="uni-list-cell-left">运动日期</view>
        		<view class="uni-list-cell-db">
        			<picker mode="date" :value="date" :start="startDate" :end="endDate" @change="bindDateChange">
        				<view class="uni-input" v-model="dailyData.date">{{date}}</view>
        			</picker>
        		</view>
        	</view>
            <view class="uni-list-cell">
            	<view class="uni-list-cell-left">运动类型</view>
            	<view class="uni-list-cell-db">
            		<picker @change="bindTypePickerChange" :value="indexType" :range="arrayType" range-key="name">
            			<view class="uni-input">{{arrayType[indexType].name}}</view>
            		</picker>
            	</view>
            </view>
            <view class="uni-list-cell">
            	<view class="uni-list-cell-left">运动时长</view>
            	<view class="uni-list-cell-db">
                    <input v-model="dailyData.sport_duriation" placeholder="    小时"/>
            	</view>
            </view>
            <view class="uni-list-cell">
            	<view class="uni-list-cell-left">最高心率</view>
            	<view class="uni-list-cell-db">
                    <input v-model="dailyData.highest_hb" placeholder="    次每分钟"/>
            	</view>
            </view>
            <view class="uni-list-cell">
            	<view class="uni-list-cell-left">自我感受</view>
            	<view class="uni-list-cell-db">
            		<picker @change="bindFeelPickerChange" :value="indexFeel" :range="arrayFeel" range-key="name">
            			<view class="uni-input">{{arrayFeel[indexFeel].name}}</view>
            		</picker>
            	</view>
            </view>
        </view>
        <button @click="send" type="primary" class="mybtn">打卡</button>
    </view>
</template>

<script>
    function getDate(type) {
    	const date = new Date();
    
    	let year = date.getFullYear();
    	let month = date.getMonth() + 1;
    	let day = date.getDate();
    
    	if (type === 'start') {
    		year = year - 10;
    	} else if (type === 'end') {
    		year = year + 10;
    	}
    	month = month > 9 ? month : '0' + month;;
    	day = day > 9 ? day : '0' + day;
    
    	return `${year}-${month}-${day}`;
    }
    const db = uniCloud.database();
    const checkDBName = 'daily-check'
    const userDBName = 'uni-id-users'
    export default {
        data() {
            let dailyData = {
                "date":getDate({
                    format: true
                }),
                "sport_type": "",
                "sport_duriation":"",
                "feeling":"",
                "highest_hb":""
            }
            return {
                title: 'picker',
                arrayType: [{name:'慢跑'},{name: '游泳'}, {name:'散步'}, {name:'球类'}],
                arrayFeel: [{name:'好'},{name:'中'},{name:'差'}],
                indexType: 0,
                indexFeel: 0,
                date: getDate({
                	format: true
                }),
                startDate:getDate('start'),
                endDate:getDate('end'),
                time: '12:01',
                dailyData
            }
        },
        computed: {
          // 连表查询，返回两个集合的查询结果
          colList() {
            return [
              db.collection(checkDBName).where(this.where).field('_id,user_id,sport_duriation,sport_type,feeling').getTemp(), // 打卡集合
              db.collection(userDBName).field('_id,nickname').getTemp() // 用户集合
            ]
          },
          where(){
          	if(this.uniIDHasRole('AUDITOR')){
          		return ''
          	}else{
          		return 'user_id._id == $cloudEnv_uid'
          	}
          }
        },
        methods: {
            async send() {
                if (this.dailyData.sport_type == "") {
                    this.dailyData.sport_type = this.arrayType[this.indexType].name;
                }
                if (this.dailyData.sport_duriation == "") {
                    this.dailyData.sport_duriation = "0";
                }
                if (this.dailyData.highest_hb == "") {
                    this.dailyData.highest_hb = "0";
                }
                if (this.dailyData.feeling == "") {
                    this.dailyData.feeling = this.arrayFeel[this.indexFeel].name;
                }
            	let res = await db.collection("daily-check").add({
                    "date":this.dailyData.date,
                    "sport_type":this.dailyData.sport_type,
                    "sport_duriation":this.dailyData.sport_duriation,
                    "highest_hb":this.dailyData.highest_hb,
                    "feeling":this.dailyData.feeling
            	})
                console.log(res.result.errCode);
            	if(res.result.errCode==0){
					uni.showToast({
						title:'打卡成功！',
                        icon:'success'
					})
            		this.dailyData = '';
                    setTimeout(() => uni.redirectTo({
                      url: '/pages/grid/dateCheck/dateCheck-calender/dateCheck-calender'
                    }),1000);
            	}
            },
            bindDateChange: function(e) {
            	this.date = e.detail.value;
                this.dailyData.date = this.date;
            },
            bindTypePickerChange: function(e) {
            	this.indexType = e.detail.value;
                this.dailyData.sport_type = this.arrayType[this.indexType].name;
            },
            bindFeelPickerChange: function(e) {
                this.indexFeel = e.detail.value;
                this.dailyData.feeling = this.arrayFeel[this.indexFeel].name;
            }
        }
    }
</script>

<style scoped lang="scss">
    .mylist{
        padding-left: 30rpx;
        padding-right: 10rpx;
    }
    .mybtn{
        background-color: #CABBE9;
    }
    .uni-list {
    	background-color: #FFFFFF;
    	position: relative;
    	width: 100%;
    	display: flex;
    	flex-direction: column;
    }
    .uni-list:after {
    	position: absolute;
    	z-index: 10;
    	right: 0;
    	bottom: 0;
    	left: 0;
    	height: 1px;
    	content: '';
    	-webkit-transform: scaleY(.5);
    	transform: scaleY(.5);
    	background-color: #c8c7cc;
    }
    /* .uni-list::before {
    	position: absolute;
    	z-index: 10;
    	right: 0;
    	top: 0;
    	left: 0;
    	height: 1px;
    	content: '';
    	-webkit-transform: scaleY(.5);
    	transform: scaleY(.5);
    	background-color: #c8c7cc;
    } */
    .uni-list-cell {
    	position: relative;
    	display: flex;
    	flex-direction: row;
    	justify-content: space-between;
    	align-items: center;
    }
    .uni-list-cell-hover {
    	background-color: #eee;
    }
    .uni-list-cell-pd {
    	padding: 22rpx 30rpx;
    }
    .uni-list-cell-left {
        white-space: nowrap;
    	font-size:40rpx;
    	padding: 50rpx 0;
    }
    .uni-list-cell-db,
    .uni-list-cell-right {
    	flex: 1;
        font-size:30rpx;
        padding: 50rpx 20rpx;
    }
    .uni-list-cell::after {
    	position: absolute;
    	z-index: 3;
    	right: 0;
    	bottom: 0;
    	left: 30rpx;
    	height: 1px;
    	content: '';
    	-webkit-transform: scaleY(.5);
    	transform: scaleY(.5);
    	background-color: #c8c7cc;
    }
    .uni-list .uni-list-cell:last-child::after {
    	height: 0rpx;
    }
    .uni-list-cell-last.uni-list-cell::after {
    	height: 0rpx;
    }
    .uni-list-cell-divider {
    	position: relative;
    	display: flex;
    	color: #999;
    	background-color: #f7f7f7;
    	padding:15rpx 20rpx;
    }
    .uni-list-cell-divider::before {
    	position: absolute;
    	right: 0;
    	top: 0;
    	left: 0;
    	height: 1px;
    	content: '';
    	-webkit-transform: scaleY(.5);
    	transform: scaleY(.5);
    	background-color: #c8c7cc;
    }
    .uni-list-cell-divider::after {
    	position: absolute;
    	right: 0;
    	bottom: 0;
    	left: 0rpx;
    	height: 1px;
    	content: '';
    	-webkit-transform: scaleY(.5);
    	transform: scaleY(.5);
    	background-color: #c8c7cc;
    }
    .uni-list-cell-navigate {
    	font-size:30rpx;
    	padding: 22rpx 30rpx;
    	line-height: 48rpx;
    	position: relative;
    	display: flex;
    	box-sizing: border-box;
    	width: 100%;
    	flex: 1;
    	justify-content: space-between;
    	align-items: center;
    }
    .uni-list-cell-navigate {
    	padding-right: 36rpx;
    }
    .uni-navigate-badge {
    	padding-right: 50rpx;
    }
    .uni-list-cell-navigate.uni-navigate-right:after {
    	font-family: uniicons;
    	content: '\e583';
    	position: absolute;
    	right: 24rpx;
    	top: 50%;
    	color: #bbb;
    	-webkit-transform: translateY(-50%);
    	transform: translateY(-50%);
    }
    .uni-list-cell-navigate.uni-navigate-bottom:after {
    	font-family: uniicons;
    	content: '\e581';
    	position: absolute;
    	right: 24rpx;
    	top: 50%;
    	color: #bbb;
    	-webkit-transform: translateY(-50%);
    	transform: translateY(-50%);
    }
    .uni-list-cell-navigate.uni-navigate-bottom.uni-active::after {
    	font-family: uniicons;
    	content: '\e580';
    	position: absolute;
    	right: 24rpx;
    	top: 50%;
    	color: #bbb;
    	-webkit-transform: translateY(-50%);
    	transform: translateY(-50%);
    }
    .uni-collapse.uni-list-cell {
    	flex-direction: column;
    }
    .uni-list-cell-navigate.uni-active {
    	background: #eee;
    }
    .uni-list.uni-collapse {
    	box-sizing: border-box;
    	height: 0;
    	overflow: hidden;
    }
    .uni-collapse .uni-list-cell {
    	padding-left: 20rpx;
    }
    .uni-collapse .uni-list-cell::after {
    	left: 52rpx;
    }
    .uni-list.uni-active {
    	height: auto;
    }
</style>
