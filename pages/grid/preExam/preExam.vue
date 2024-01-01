<template>
    <uni-list>
    	<uni-list-item v-for="(item,index) in examList" :key="index" :title = "item.name" :note = "item.detail" >
            
        </uni-list-item>
    </uni-list>
</template>

<script>
    export default {
        data() {
            return {
                examList:[
                    {name:'血常规',detail:'了解准孕妇是否有贫血、感染。'},
                    {name:'血型检查',detail:'可预测是否发生母婴不合溶血症，如ABO血型不合、Rh血型不合'},
                    {name:'尿常规',detail:'了解是否有泌尿系统感染,其他肾脏疾患的初步筛查,间接了解糖代谢、胆红素代谢。'},
                    {name:'肝功检查',detail:'及时发现乙肝病毒携带者和病毒性肝炎患者，给予治疗。'},
                    {name:'口腔检查',detail:'怀孕后，由于体内性激素的变化导致牙龈容易充血肿胀。如果孕前存在牙周疾病，怀孕后牙周炎症会更加严重，不得不使用药物。'}
                    ]
            }
        },
        methods: {
            
        }
    }
</script>

<style>

</style>
