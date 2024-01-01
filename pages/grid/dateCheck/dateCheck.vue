<template>
    <view class="uni-padding-wrap uni-common-mt">
        <unicloud-db ref="udb" :where="where" v-slot:default="{data, loading, error, options}"
        	collection="daily-check,uni-id-users" field="_id,user_id.nickname,user_id._id,sport_type,feeling,sport_duriation,highest_hb,date">
        	<view v-if="loading && error">{{error.message}}</view>
        	<view v-else>
        		<view v-for="(item,index) in data" :key="index" class="flex-column">
                    <view class="uni-flex-item">
                        <view class="uni-h4 uni-common-mt">{{item.date}}</view>
                        <view class="uni-flex uni-row">
                            <view class="uni-flex-item">运动类型：{{item.sport_type}}</view>
                            <view class="uni-flex-item">运动时长：{{item.sport_duriation}} 小时</view>
                        </view>
                        <view class="uni-flex uni-row">
                            <view class="uni-flex-item">最高心率：{{item.highest_hb}} 次每分</view>
                            <view class="uni-flex-item">感受：{{item.feeling}}</view>
                        </view>
                    </view>
        		</view>
        	</view>
            <view class="common-page-head">已经没有啦</view>
        </unicloud-db>
        
        <uni-fab ref="fab" :pattern="pattern" :content="content" :horizontal="horizontal" :vertical="vertical"
            :direction="direction" @fabClick="onclickCheck" />
    </view>
</template>

<script>
    const db = uniCloud.database();
    const checkDBName = 'daily-check'
    const userDBName = 'uni-id-users'
    export default {
        data() {
            let dailyData = {
                "sport_type": "",
                "sport_duriation":"",
                "feeling":"",
                "highest_hb":""
            }
            return {
                directionStr: '垂直',
                horizontal: 'right',
                vertical: 'bottom',
                direction: 'horizontal',
                pattern: {
                    color: '#7A7E83',
                    backgroundColor: '#fff',
                    selectedColor: '#007AFF',
                    buttonColor: '#007AFF',
                    iconColor: '#fff'
                },
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
            onclickCheck(e) {
                uni.navigateTo({
                  url: '/pages/grid/dateCheck/dateItem/dateItem'
                });
            },
            async send() {
            	let res = await db.collection("daily-check").add({
                    "sport_type":this.dailyData.sport_type,
                    "sport_duriation":this.dailyData.sport_duriation,
                    "highest_hb":this.dailyData.highest_hb,
                    "feeling":this.dailyData.feeling
            	})
            	if(!res.result.code){
            		uni.showToast({
            			title:'打卡成功！',
            			icon:'none'
            		})
            		this.text = '';
            		this.$refs.udb.refresh();
            	}
            },
            add(){
                const db = uniCloud.database();
                const dailyChecktable = db.collection("daily-check");
                // dailyChecktable.add({
                //     "sport_type":"1",
                //     "state":true
                // }
                // )
                // console.log(dailyChecktable.doc('65901a407ad52d5932b80951'));
                
            }
        }
    }
</script>

<style scoped lang="scss">
	.add {
		padding: 20rpx;
		box-sizing: border-box;

		.main {
			display: flex;
			justify-content: center;
			align-items: center;
			margin-bottom: 40rpx;
			padding-bottom: 20rpx;
			border-bottom: 1px solid #ccc;

			.img {
				width: 200rpx;
				height: 200rpx;
				margin-right: 20rpx;
			}

			.right {
				flex: 1;
				color: #333;
                
				.time-date {
					font-size: 40rpx;
					margin-bottom: 10rpx;
				}

				.text {
					font-size: 30rpx;
				}
			}
		}

		.submit-box {
			position: absolute;
			bottom: 10rpx;
			display: flex;
			width: calc(100vw - 40rpx);

			.input-box {
				background-color: #f7f7f7;
				height: 80rpx;
				flex: 1;
			}

			.btn {
				height: 80rpx;
				width: 140rpx;
				font-size: 32rpx;
				line-height: 80rpx;
			}
		}
	}
</style>