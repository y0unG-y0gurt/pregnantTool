<template>
    <view>
    <uni-list v-for="(item,index) in medalList" :key="index">
        <uni-list-item v-if="item.hasdone=='已完成'"  :title="item.name" :note="item.detail" thumb="/static/完成成就.png"
         thumb-size="lg" :rightText="item.hasdone"></uni-list-item>
         <uni-list-item v-if="item.hasdone=='未完成'"  :title="item.name" :note="item.detail" thumb="/static/未完成成就.png"
          thumb-size="lg" :rightText="item.hasdone"></uni-list-item>
    </uni-list>
    </view>
</template>

<script>
    const db = uniCloud.database();
    const checkDBName = 'daily-check'
    export default {
        data() {
            return {
                dateList:[],
                medalList:[
                    {name:'初出茅庐',detail:'完成你的第一次打卡',hasdone:'未完成'},
                    {name:'小有所成',detail:'累积打卡一周',hasdone:'未完成'},
                    {name:'运动新星',detail:'累积打卡两周',hasdone:'未完成'},
                    {name:'运动老手',detail:'累积打卡一个月',hasdone:'未完成'},
                    {name:'健身达人',detail:'累积打卡三个月',hasdone:'未完成'}
                    ]
            }
        },
        async created(){
            await db.collection(checkDBName).where("user_id == $cloudEnv_uid").field('date').get().then((res)=>{
                //console.log(res.result.data);
                for (var i = 0; i < res.result.data.length;i++) {
                    if (this.dateList.indexOf(res.result.data[i].date) == -1)
                    {
                        this.dateList.push({
                            date: res.result.data[i].date
                        });
                    }
                }
            });
            var len = this.dateList.length;
            if (len >= 1)
            {
                this.medalList[0].hasdone='已完成';
            }
            if (len >= 7)
            {
                this.medalList[1].hasdone='已完成';
            }
            if (len >= 14)
            {
                this.medalList[2].hasdone='已完成';
            }
            if (len >= 30)
            {
                this.medalList[3].hasdone='已完成';
            }
            if (len >= 90)
            {
                this.medalList[3].hasdone='已完成';
            }

        },
        mounted() {

        },
        methods: {

        }
    }
</script>

<style>

</style>
