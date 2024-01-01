<template>
    <view class="container">
        <uni-card :cover="coverQJCNR" @click="onClick">
            <text class="uni-body">青椒炒牛肉具有补中益气、强筋健骨的作用，特别适合缺铁性贫血、体虚气短的孕妇食用，另外这道菜中含有的维生素成分也非常适合胎儿的成长发育。</text>
        </uni-card>
        <uni-card :cover="coverBCZGZ" @click="onClick">
            <text class="uni-body">孕妈妈孕中后期可能会有缺铁性贫血，补铁剂又会吸收不好。每个礼拜吃一到两次动物内脏，对妈妈和宝宝都好哦。</text>
        </uni-card>
        <uni-card :cover="coverCLBC" @click="onClick">
            <text class="uni-body">孕早期的麻麻们嘴里常常没有味道，此时不如来一道开胃有营养的醋溜白菜吧！</text>
        </uni-card>
        <uni-card :cover="coverQJCZG" @click="onClick">
            <text class="uni-body">猪肝含有较多的维生素A，铁，锌等适合孕期食用，尤其是营养缺乏性贫血时，每周可以吃2次左右，食用猪肝要注意排净其内的血液，一定要做熟。</text>
        </uni-card>
    </view>
</template>

<script>
    export default {
        components: {},
        data() {
            return {
                coverQJCNR: 'https://www.freeimg.cn/i/2024/01/01/659222e69e3dc.jpg',
                coverBCZGZ: 'https://www.freeimg.cn/i/2024/01/01/659222e6ada95.jpg',
                coverCLBC: 'https://www.freeimg.cn/i/2024/01/01/659222ea8ce47.jpg',
                coverQJCZG: 'https://www.freeimg.cn/i/2024/01/01/659222eaa286d.jpg',
                avatar: 'https://qiniu-web-assets.dcloud.net.cn/unidoc/zh/unicloudlogo.png',
                extraIcon:{
                    color: '#4cd964',
                    size: '22',
                    type: 'gear-filled'
                }
            }
        },
        methods: {
            			onClick(e){
            				console.log(e)
            			},
            			actionsClick(text){
            				uni.showToast({
            					title:text,
            					icon:'none'
            				})
            			}
        }
    }
</script>

<style>

</style>
