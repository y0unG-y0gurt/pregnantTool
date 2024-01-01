<template>
	<view class="top-window">
		<view class="box">
			<view class="title">uni-vote</view>
			<view>全端的、开源的、云端一体的问卷投票项目模板。</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
			}
		},
		onLoad() {
		},
		methods: {
		}
	}
</script>

<style>
.top-window{
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	height: 99px;
	padding:  0 20px;
	justify-content: space-between;
	border-bottom: #e5e5e5 solid 1px;
	background-color: #FFFFFF;
}
.title{
	font-weight: 800;
	font-size:20px;
	margin-right: 20px;
}
.box{
	display: flex;
	flex: 1;
	flex-direction: row;
	align-items: center;
}
</style>
