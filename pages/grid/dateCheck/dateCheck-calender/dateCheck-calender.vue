<template>
    <view class="uni-padding-wrap uni-common-mt">
        <uni-calendar 
        :insert="true"
        :lunar="true" 
        :start-date="'2000-1-1'"
        :end-date="'2024-12-31'"
        :selected="info.selected"
        @change="change"
         />
         <unicloud-db ref="udb" :where="where" v-slot:default="{data, loading, error, options}" loadtime="onready"
         	collection="daily-check,uni-id-users" field="_id,user_id.nickname,user_id._id,sport_type,feeling,sport_duriation,highest_hb,date">
         	<view v-if="error">{{error.message}}</view>
         	<view v-else>
         		<view v-for="(item,index) in data" :key="index" class="flex-column">
                     <view class="uni-flex-item">
                         <!-- <view class="uni-h4 uni-common-mt">{{item.date}}</view> -->
                         <view class="uni-flex uni-row">
                            <view class="uni-flex-item mydate">{{item.date}}</view>
                            <button class="uni-flex-item mydelete" type="warn" @click="ondelete(item._id)">删除</button>
                         </view>
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
            return {
                directionStr: '垂直',
                horizontal: 'right',
                vertical: 'bottom',
                direction: 'horizontal',
                pattern: {
                    color: '#7A7E83',
                    backgroundColor: '#fff',
                    selectedColor: '#FFCEF3',
                    buttonColor: '#CABBE9',
                    iconColor: '#fff'
                },
                date:"",
                info: {
                    lunar: true,
                    range: true,
                    insert: false,
                    selected: []
                }
            }
        },
        computed: {
            colList() {
              return [
                db.collection(checkDBName).where("user_id._id == $cloudEnv_uid").field('_id,user_id,sport_duriation,sport_type,highest_hb,feeling,date').getTemp(), // 打卡集合
                db.collection(userDBName).field('_id,nickname').getTemp() // 用户集合
              ]
            },
          where(){
            return `user_id._id == $cloudEnv_uid && date == "${this.date}"`
          }
        },
        onLoad() {
            db.collection(checkDBName).where("user_id == $cloudEnv_uid").field('date').get().then((res)=>{
                for (var i = 0; i < res.result.data.length;i++) {
                    if (this.info.selected.indexOf(res.result.data[i].date) == -1)
                    {
                        this.info.selected.push({
                            date: res.result.data[i].date,
                            info: '打卡'
                        })
                    }
                }
            })
        },
        onUnload() {

        },
        onReady() {
          // 开始加载数据，修改 where 条件后才开始去加载 clinetDB 的数据 ，需要等组件渲染完毕后才开始执行 loadData，所以不能再 onLoad 中执行
          if (this.date) { // ID 不为空，则发起查询
            this.$refs.udb.refresh();
            this.$refs.udb.loadData()
          }
          db.collection(checkDBName).where("user_id == $cloudEnv_uid").field('date').get().then((res)=>{
              for (var i = 0; i < res.result.data.length;i++) {
                  if (this.info.selected.indexOf(res.result.data[i].date) == -1)
                  {
                      this.info.selected.push({
                          date: res.result.data[i].date,
                          info: '打卡'
                      })
                  }
              }
          })
        },
        methods: {
            async ondelete(para) {
                let res = await db.collection("daily-check").where(`_id == "${para}"`).remove({

                });      
                if(res.result.errCode==0){
                	uni.showToast({
                		title:'删除成功！',
                		icon:'none'
                	})
                	this.$refs.udb.refresh();
                }
            },
            onclickCheck(e) {
                uni.redirectTo({
                  url: '/pages/grid/dateCheck/dateItem/dateItem'
                });
            },
            open(){
            	this.$refs.calendar.open();
            },
            change(e) {
                this.date = e.fulldate;
            }
        }
    }
</script>

<style>
.mydate{
    flex-grow: 5;
    
}
.mydelete{
    flex-shrink: 1;
    font-size: 30rpx;
    padding: 0rpx 0rpx 0rpx 0rpx;
}
</style>
