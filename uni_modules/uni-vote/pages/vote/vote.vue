<template>
	<view class="vote-box">
		<!-- 使用unicloud-db组件获取投票数据 -->
		<unicloud-db ref="udb" v-slot:default="{data, loading, error, options, hasMore}" @load="loadData" :where="cWhere"
			collection="uni-vote">
			<!-- 显示错误信息 -->
			<view v-if="error">{{error.message}}</view>
			<!-- 显示投票列表 -->
			<view v-else class="list-box">
				<uni-list v-if="data.length" :border="false" class="list">
					<uni-list-item v-for="(item,index) in data" :key="index" showArrow :clickable="true"
						@click="handleItemClick(item,index)" class="list-item" :border="false"
						:class='{"active":index === activeIndex,"border-top":index === 0}'>
						<!-- 显示投票信息 -->
						<template v-slot:body>
							<view class="slot-main">
								<view class="vote-info">
									<view class="slot-title">{{item.title}}</view>
									<view class="slot-description" v-if="item.description">{{item.description}}</view>
									<view class="time-box" v-if="item.period_of_validity == 1">
										<view v-if="item.start_date">
											<text class="time-tip">开始时间：</text>
											<uni-dateformat class="time-date" :date="item.start_date" :threshold="[0, 0]" />
										</view>
										<view v-if="item.end_date">
											<text class="time-tip">结束时间：</text>
											<uni-dateformat class="time-date" :date="item.end_date" :threshold="[0, 0]" />
										</view>
									</view>
								</view>
								<!-- 显示投票状态 -->
								<view v-if="item.period_of_validity == 1 && item.start_date && item.end_date" class="date-status">
									{{getVoteDateStatusText(item)}}</view>
							</view>
						</template>
					</uni-list-item>
				</uni-list>
				<!-- 显示加载更多 -->
				<uni-load-more v-if="loading" :status="loading?'loading':(hasMore ? 'more' : 'noMore')"></uni-load-more>
			</view>
		</unicloud-db>
	</view>
</template>

<script>
	let startTitle = false,
		toIndex = 0,
		dataList = [];
	export default {
		data() {
			return {
				activeIndex: 0,
				uid: ''
			}
		},
		computed: {
			// 计算查询条件
			cWhere() {
				return `"status" == 1 && "count" > 0 && "is_delete" != true `
			}
		},
		onShow() {
			// 获取当前用户ID
			this.uid = uniCloud.getCurrentUserInfo().uid
		},
		onLoad(param) {
			// 获取传入的参数
			if (param && param.title) {
				startTitle = param.title
			}
		},
		created() {
			this._isWidescreen = false;
			// #ifdef H5
			// 监听屏幕宽度变化
			var mediaQueryOb = uni.createMediaQueryObserver(this)
			mediaQueryOb.observe({
				minWidth: 768
			}, matches => {
				this._isWidescreen = matches;
			})
			// #endif
		},
		onPullDownRefresh() {
			this.$refs.udb.loadData({
				clear: true
			}, () => {
				uni.stopPullDownRefresh()
			})
		},
		onReachBottom() {
			this.$refs.udb.loadMore()
		},
		methods: {
			// 加载数据
			loadData(data) {
				dataList = data
				if (data.length && this._isWidescreen) {
					this.handleItemClick(data[0])
				}
			},
			// 处理列表项点击事件
			handleItemClick(detail, index = 0) {
				if (toIndex === 0 && startTitle) {
					let startIndex = dataList.findIndex(item => item.title == startTitle)
					this.activeIndex = startIndex

					let startItem = dataList.find(item => item.title == startTitle)
					detail = startItem
				} else {
					this.activeIndex = index
				}
				toIndex++

				// 获取投票状态文本
				if (detail.status && detail.status == 1 && detail.period_of_validity == 1) {
					detail['dateStatusText'] = this.getVoteDateStatusText(detail)
				}

				var info = {
					detail,
					uid: this.uid
				}

				// 判断是否为宽屏，触发不同的事件
				if (this._isWidescreen) { //若为宽屏，则触发右侧详情页的自定义事件
					history.pushState({}, '', '/#/?title=' + detail.title);
					uni.$emit('updateDetail', {
						info: encodeURIComponent(JSON.stringify(info))
					})
				} else {
					uni.navigateTo({
						url: '/uni_modules/uni-vote/pages/vote-items/vote-items?info=' + encodeURIComponent(JSON
							.stringify(info))
					});
				}
			},
			// 获取投票状态文本
			getVoteDateStatusText(item) {
				if (item.status && item.status == 1 && item.period_of_validity == 1) {
					let nowDate = Date.now()
					if (item.start_date < nowDate && item.end_date < nowDate) {
						return "已结束"
					} else if (item.start_date < nowDate && item.end_date > nowDate) {
						return "进行中"
					} else if (item.start_date > nowDate && item.end_date > nowDate) {
						return "未开始"
					}
				}
			}
		}
	}
</script>

<style>
	@media screen and (max-width:768px) {
		.list-box {
			/* height: calc(100vh - 120px); */
			overflow-y: scroll;
		}

		.list-item {
			padding: 10px 0 10px 10px;
		}

		.slot-description {
			width: 270px;
		}
	}

	@media screen and (min-width:769px) {
		.vote-box {
			height: calc(100vh - 100px);
		}

		.list-box {
			height: calc(100vh - 130px);
			overflow-y: scroll;
			/* #ifdef H5 */
			scrollbar-width: none;
			-ms-overflow-style: none;
			overflow-y: auto;
			/* #endif */
		}

		/* #ifdef H5 */
		.list-box::-webkit-scrollbar {
			display: none;
		}

		/* #endif */
		.list-item {
			padding: 10px 0 10px 20px;
		}

		.slot-description {
			width: 330px;
		}
	}

	.vote-box {
		flex-direction: column;
		background-color: #FFF;
	}

	.slot-description {
		font-size: 14px;
		color: #999;
	}

	.list-item {
		border-bottom: #f0f2f4 solid 1px;
		/* #ifdef H5 */
		border-right: 0;
		/* #endif */
		/* #ifdef MP-WEIXIN */
		padding: 10px;
		/* #endif */
	}
	.border-top {
		border-top: #f0f2f4 solid 1px;
	}

	.active {
		background-color: #F8F8F8 !important;
	}

	.slot-main {
		display: flex;
		flex-direction: row;
		align-items: center;
		width: 100%;
	}

	.vote-info {
		flex: 1;
	}

	.slot-title {
		font-size: 18px;
		line-height: 40px;
	}

	.time-box {
		display: flex;
		flex-direction: column;
		margin-top: 10px;
	}


	.time-tip,
	.time-date,
	.date-status,
	.slot-description {
		font-size: 14px;
	}

	.time-tip,
	.time-date {
		color: #999999;
	}

	.date-status {
		color: #f05000;
		width: 60px;
	}
</style>