<template>
	<view class="warp">
		<!-- #ifdef APP-PLUS -->
		<statusBar></statusBar>
		<!-- #endif -->
		
		<!-- banner -->
		<unicloud-db ref="bannerdb" v-slot:default="{data, loading, error, options}" collection="opendb-banner"
			field="_id,bannerfile,open_url,title" @load="onqueryload">
			<!-- 当无banner数据时显示占位图 -->
			<image v-if="!(loading||data.length)" class="banner-image" src="/static/uni-center/headers.png" mode="aspectFill" :draggable="false" />
			
			<swiper v-else class="swiper-box" @change="changeSwiper" :current="current" indicator-dots>
				<swiper-item v-for="(item, index) in data" :key="item._id">
					<view class="swiper-item" @click="clickBannerItem(item)">
						<image class="banner-image" :src="item.bannerfile.url" mode="aspectFill" :draggable="false" />
					</view>
				</swiper-item>
			</swiper>
		</unicloud-db>

		<!-- 宫格 -->
		<view class="section-box">
			<text class="decoration" style="background-color: #a1eafb;"></text>
			<text class="section-text">小工具</text>
		</view>
		
		<view class="example-body">
			<uni-grid :column="3" :highlight="true" :showBorder="false">
                <uni-grid-item :key="1" @click.native="onclickVote">
                    <view class="grid-item-box" style="background-color: #fff;">
                        <uni-icons type="list" :size="50"  color="#ffcef3"/>
                    	<text class="text">问卷</text>
                    </view>
                </uni-grid-item>
                <uni-grid-item :key="2" @click.native="onclickFood">
                    <view class="grid-item-box" style="background-color: #fff;">
                    	<!-- <image :src="'/static/grid/c'+(i+1)+'.png'" class="image" mode="aspectFill" /> -->
                        <uni-icons type="shop" :size="50"  color="#ffcef3"/>
                    	<text class="text">备孕食谱</text>
                    </view>
                </uni-grid-item>
                <uni-grid-item :key="3" @click.native="onclickCheckCal">
                    <view class="grid-item-box" style="background-color: #fff;">
                    	<uni-icons type="calendar" :size="50"  color="#ffcef3"/>
                    	<text class="text">运动日记</text>
                    </view>
                </uni-grid-item>
                <uni-grid-item :key="4" @click.native="onclickPreExam">
                    <view class="grid-item-box" style="background-color: #fff;">
                    	<uni-icons type="info" :size="50"  color="#ffcef3"/>
                    	<text class="text">孕前检查</text>
                    </view>
                </uni-grid-item>
                <uni-grid-item :key="5" @click.native="onclickMedal">
                    <view class="grid-item-box" style="background-color: #fff;">
                    	<uni-icons type="medal" :size="50"  color="#ffcef3"/>
                    	<text class="text">我的成就</text>
                    </view>
                </uni-grid-item>
                <uni-grid-item :key="5" @click.native="onclickAbout">
                    <view class="grid-item-box" style="background-color: #fff;">
                    	<uni-icons type="help" :size="50"  color="#ffcef3"/>
                    	<text class="text">关于小程序</text>
                    </view>
                </uni-grid-item>
			</uni-grid>
		</view>
	</view>
</template>

<script>
	// #ifdef APP-PLUS
	import statusBar from "@/uni_modules/uni-nav-bar/components/uni-nav-bar/uni-status-bar";
	// #endif
	export default {
		// #ifdef APP-PLUS
		components: {
			statusBar
		},
		// #endif
		data() {
			return {
				gridList: [],
				current: 0,
				hasLogin:false
			}
		},
		onShow() {
			this.hasLogin = uniCloud.getCurrentUserInfo().tokenExpired > Date.now()
		},
		onLoad() {
			let gridList = []
            
			for (var i = 0; i < 3; i++) {
				gridList.push( this.$t('grid.visibleToAll') )
			}
			for (var i = 0; i < 3; i++) {
				gridList.push( this.$t('grid.invisibleToTourists') )
			}
			for (var i = 0; i < 3; i++) {
				gridList.push( this.$t('grid.adminVisible') )
			}
			this.gridList = gridList
		},
		methods: {
            onclickVote(e) {
                console.log(e);
                uni.navigateTo({
                  url: '/uni_modules/uni-vote/pages/vote/vote'
                });
            },
            onclickFood(e) {
                uni.navigateTo({
                  url: '/pages/grid/foodList/foodList'
                });
            },
            onclickCheckCal(e) {
                uni.navigateTo({
                  url: '/pages/grid/dateCheck/dateCheck-calender/dateCheck-calender'
                });
            },
            onclickPreExam(e){
                uni.navigateTo({
                  url: '/pages/grid/preExam/preExam'
                });
            },
            onclickMedal(e){
                uni.navigateTo({
                  url: '/pages/grid/medalList/medalList'
                });
            },
            onclickAbout(e){
                uni.navigateTo({
                  url: '/pages/grid/aboutThis/aboutThis'
                });
            },
			/**
			 * banner加载后触发的回调
			 */
			onqueryload(data) {
			},
			changeSwiper(e) {
				this.current = e.detail.current
			},
			/**
			 * 点击banner的处理
			 */
			clickBannerItem(item) {
				// 有外部链接-跳转url
				if (item.open_url) {
					uni.navigateTo({
						// url: '/uni_modules/uni-id-pages/pages/common/webview/webview?url=' + item.open_url + '&title=' + item.title,
                        url: '/uni_modules/uni-cms-article/pages/detail/detail?id='+item.open_url,
						success: res => {},
						fail: () => {},
						complete: () => {}
					});
				}
				// 其余业务处理
			}
		}
	}
</script>

<style>
	/* #ifndef APP-NVUE */
	page {
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
		background-color: #fff;
		min-height: 100%;
		height: auto;
	}
	view {
		font-size: 14px;
		line-height: inherit;
	}
	.example-body {
		/* #ifndef APP-NVUE */
		display: flex;
		/* #endif */
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: center;
		padding: 0;
		font-size: 14px;
		background-color: #ffffff;
	}
	/* #endif */
	
	.section-box{
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 20rpx;
	}
	.decoration{
		width: 4px;
		height: 12px;
		border-radius: 10px;
		background-color: #2979ff;
	}
	.section-text{
		color: #333;
		margin-left: 15rpx;
	}

	/* #ifdef APP-NVUE */
	.warp {
		background-color: #fff;
	}
	/* #endif */

	.example-body {
		flex-direction: column;
		padding: 15px;
		background-color: #ffffff;
	}

	.image {
		width: 50rpx;
		height: 50rpx;
	}
	
	.big-number{
		font-size: 50rpx;
		font-weight: 700;
		font-stretch: condensed;
		font-style:oblique;
	}
	
	.text {
		text-align: center;
		font-size: 26rpx;
		margin-top: 10rpx;
	}

	.example-body {
		/* #ifndef APP-NVUE */
		display: block;
		/* #endif */
	}

	.grid-item-box {
		flex: 1;
		/* #ifndef APP-NVUE */
		display: flex;
		/* #endif */
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 15px 0;
	}

	.banner-image {
		width: 750rpx;
		height: 400rpx;
	}

	.swiper-box {
		height: 400rpx;
	}

	.search-icons {
		padding: 16rpx;
	}

	.search-container-bar {
		/* #ifndef APP-NVUE */
		display: flex;
		/* #endif */
		flex-direction: row;
		justify-content: center;
		align-items: center;
		position: fixed;
		left: 0;
		right: 0;
		z-index: 10;
		background-color: #fff;
	}

	/* #ifndef APP-NVUE || VUE3*/
	::v-deep
	/* #endif */
	.uni-searchbar__box {
		border-width: 0;
	}

	/* #ifndef APP-NVUE || VUE3 */
	::v-deep
	/* #endif */
	.uni-input-placeholder {
		font-size: 28rpx;
	}
</style>
