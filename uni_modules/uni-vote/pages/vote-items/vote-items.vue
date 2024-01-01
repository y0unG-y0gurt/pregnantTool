<template>
	<view class="vote-items-box">
		<!-- 显示状态 -->
		<view v-if="voteInfo.dateStatusText && voteInfo.dateStatusText != '进行中'" class="date-status-text">
			{{voteInfo.dateStatusText}}
		</view>
		<!-- 显示规则 -->
		<view class="rule" v-if="uid && hasLogin && voteConfigType">
			<template v-if="voteConfigType == 'single'">
				温馨提示：每个产品每位用户{{voteConfig.singleVotePeriod}}{{voteConfig.singleVotePeriodUnit}}有{{voteConfig.singleVoteMaxCount}}次投票机会，你还有{{voteConfig.ableVoteCount}}次投票。
			</template>
			<template v-if="voteConfigType == 'multiple'">
				温馨提示：每个产品每位用户有{{voteConfig.multipleVoteMaxCount}}次投票机会，你还有{{voteConfig.ableVoteCount}}次投票。
			</template>
		</view>

		<uni-forms :model="formData" ref="customForm" labelWidth="40px" validateTrigger="submit" :rules="rules">
			<!-- 显示问题列表 -->
			<template v-if="dataList.length">
				<view class="question-list" v-for="(item,questionIndex) in dataList" :key="questionIndex">
					<!-- 问题 -->
					<uni-forms-item :label="(questionIndex + 1) + '.'" required name="title">
						<view class="title">{{item.title}}</view>
					</uni-forms-item>

					<!-- 显示选项 -->
					<uni-forms-item :name="item._id">
						<uni-data-checkbox class="checkbox" :map="{text:'title',value:'_id'}"
							@change="chengeCheckbox($event,questionIndex)"
							:multiple="item.type == 'checkbox'"
							 mode="list" v-model="formData[item._id]"
							selectedColor="#2979ff" selectedTextColor="#2979ff" :localdata="item.vote_items" />


						<!-- 显示其他选项输入框 -->
						<!-- #ifdef MP-WEIXIN -->
						<view v-if="hasRecords(item) || (hasInput(item) && showInput[questionIndex])">
						<!-- #endif -->
						<!-- #ifndef MP-WEIXIN -->
						<view v-if="hasIn(formData[item._id])">
						<!-- #endif -->
							<input type="text" v-model="otherObj[item._id]" :disabled="disabledBtn|| disable" placeholder="请输入"
									class="input" :class="{'disable':disabledBtn|| disable}">
							</view>
					</uni-forms-item>
				</view>
				<button type="primary" class="submit-btn" :disabled="disabledBtn || disable"
					@click="submit('customForm')">提交</button>
			</template>
		</uni-forms>
	</view>
</template>

<script>
	// 引入数据库和投票模块
	const db = uniCloud.database()
	const vote = uniCloud.importObject('uni-vote-co')
	let _data = {
		otherObj: {},
		otherItemIds: [],
		formData: {},
		rules: {},
		dataList: [],
		voteInfo: {
			_id: '',
			title: '',
			status: '',
			type: '',
			period_of_validity: '',
			dateStatusText: ''
		},
		voteConfig: {
			ableVoteCount: '',
			multipleVoteMaxCount: '',
			singleVoteMaxCount: '',
			singleVotePeriod: '',
			singleVotePeriodUnit: '',
			errMsg: ''
		},
		uid: '',
		hasLogin: '',
		disable: false,
		lastRecords:[],
		showInput:[]
	}

	export default {
		data() {
			return {
				..._data
			}
		},
		created() {
			this._isWidescreen = false;
			// #ifdef H5
			var mediaQueryOb = uni.createMediaQueryObserver(this)
			mediaQueryOb.observe({
				minWidth: 768
			}, matches => {
				this._isWidescreen = matches;
			})
			uni.$on('updateDetail', data => {
				this.load(data.info)
			})
			// #endif
		},
		computed: {
			// 判断提交按钮是否禁用
			disabledBtn() {
				// 未开始或已结束，不能投票
				if (this.voteInfo.period_of_validity == 1 && (this.voteInfo.dateStatusText == '已结束' || this.voteInfo.dateStatusText == '未开始')) {
					return true
				}
				// 次数用完，不能再投票  
				if (this.voteConfig.ableVoteCount === 0 || this.lastRecords.length>0) {
					return true
				}
				return false
			},
			// 判断是否有配置
			voteConfigType() {
				let {
					singleVoteMaxCount,
					singleVotePeriod,
					singleVotePeriodUnit,
					multipleVoteMaxCount
				} = this.voteConfig
				// 单问题问卷
				if (this.dataList.length == 1 && singleVoteMaxCount > 0 && singleVotePeriod > 0 && singleVotePeriodUnit) {
					return 'single'
				}
				// 多问题问卷
				if (this.dataList.length > 1 && multipleVoteMaxCount > 0) {
					return 'multiple'
				}
			}
		},
		onLoad(event) {
			this.load(event.info)
		},
		onShow(){
			// #ifdef MP-WEIXIN
			if (this.showInput.includes(true)) {
			  this.showInput = this.showInput.map(val => val === true ? false : val);
			}
			// #endif
		},
		onReady() {
			if (this.rules) {
				this.$refs.customForm.setRules(this.rules)
			}
		},
		methods: {
			// 加载数据
			load(e) {
				if (this._isWidescreen) {
					// data init
					for (let key in _data) {
						this[key] = _data[key]
					}
				}

				let options;
				options = JSON.parse(decodeURIComponent(e));
				if (!this._isWidescreen) {
					if (options.detail.title) {
						uni.setNavigationBarTitle({
							title: options.detail.title
						})
					}
				}
				this.uid = options.uid
				this.hasLogin = uniCloud.getCurrentUserInfo().tokenExpired > Date.now()

				this.voteInfo = options.detail
				this.initData(options.detail._id)
			},
			// 初始化数据
			async initData(vote_id) {
				// 使用getTemp先过滤处理获取临时表再联表查询
				const questions = db.collection('uni-vote-questions')
					.where(`"status" == 1 && "vote_id" == "${vote_id}" && "is_delete" != true`)
					.orderBy('create_date asc')
					.getTemp()
				const voteItems = db.collection('uni-vote-questions-options')
					.where(`"status" == 1 && "is_delete" != true`).orderBy('sort asc')
					.getTemp()
				// 将获取的uni-vote-questions表的临时表和uni-vote-questions-options表进行联表查询
				const res = await db.collection(questions, voteItems).get()
				let data = res.result.data

				data.map(item => {
					item.vote_items = item._id['uni-vote-questions-options']
					item._id = item._id._value
				})
				this.dataList = data
				this.otherItemIds = this.getOtherItemIds()
				
				this.rules = {}
				this.formData = {}
				
				this.dataList.forEach(item => {
					// #ifdef MP-WEIXIN
					this.formData[item._id] = []
					this.otherObj[item._id] = ''
					// #endif

					this.rules[item._id] = {
						rules: [{
								required: true,
								errorMessage: "最少选中一个"
							},
							{
								validateFunction: (rule, value, data, callback) => {
									
									let otherItemId = this.otherItemIds.includes(value) ||
									    (Array.isArray(value) && value.find(_id => this.otherItemIds.includes(_id)));
									
									if (otherItemId && this.otherObj[item._id] == null) {
									   callback('你选中了其他，请输入内容')
									}
									return true
								}
							}
						]
					}
				})
				if (this.uid && this.hasLogin) {
					this.checkConfig(vote_id)
				}
			},
			// 检查投票配置
			async checkConfig(vote_id) {
				await vote.checkConfig(vote_id).then((res) => {
					// console.log("voteConfig: ",res);
					this.voteConfig = res.data
				}).catch(err => {
					// console.log('err: ',err.errCode);
					// console.log('err: ',err.errMsg);
					if (err.errCode) {
						this.disable = true
						this.getLastRecords(vote_id)
					}
				})
			},
			// 最后一次投票记录
			async getLastRecords(vote_id) {
				await vote.getLastRecords(vote_id).then((res) => {
					// console.log("LastRecords: ",res);
					this.lastRecords = res.data
					if (res.data.length){this.showResult(res.data)}
				}).catch(err => {
					console.log('err: ', err.errMsg);
				})
			},
			// 判断是否包含其他选项
			hasIn(ids) {
				if(!Array.isArray(ids)){
					ids = [ids]
				}
				return ids.find(id => this.otherItemIds.includes(id))
			},
			// mp投票记录是否包含其他项
			hasRecords(item){
				if(this.lastRecords.length<0 || this.lastRecords.length === 0){
					return false
				}
				let inputableId;
				this.lastRecords.map((record)=>{
					if(record.vote_question_id === item._id ){
						if(!Array.isArray(record.option_ids)){
							record.option_ids = [record.option_ids]
						}
						const optionItem =  record.option_ids.find(option => option.hasOwnProperty("input_value"))
						if(optionItem){
							inputableId = optionItem._id
						}
					}
				})
				return this.otherItemIds.includes(inputableId)
			},
			// mp判断是否包含其他选项
			hasInput(item) {
				const filteredItems = item.vote_items.findIndex(i => i.input_able == true && this.otherItemIds.includes(i._id));
				return filteredItems>0?true:false
			},
			// mp选择项
			chengeCheckbox(e,index){
				let values = e.detail.value
				if(!Array.isArray(values)){
					values = [values]
				}
				let hasInpueId = values.find(id => this.otherItemIds.includes(id))
				this.showInput.splice(index,1,!!hasInpueId)
			},
			// 获取其他选项的ID
			getOtherItemIds(){
				return this.dataList.reduce((sum, current, index) => {
						sum.push(...current.vote_items)
						return sum
					}, [])
					.filter(item => item.input_able)
					.map(item => item._id)
			},
			// 校验选项
			checkSubmitValue(valueKey, submitValueKey) {
				if (this.dataList.length !== 1 || this.dataList[0].type !== 'checkbox' || !this.voteConfig) {
					return true;
				}
				const {
					singleVoteMaxCount,
					ableVoteCount
				} = this.voteConfig;
				if (singleVoteMaxCount && [valueKey].length > singleVoteMaxCount) {
					this.handleShowModal(`【${this.voteInfo.title}】单次选项不能超过${singleVoteMaxCount}个`)
				} else if (ableVoteCount && submitValueKey.length > ableVoteCount) {
					this.handleShowModal(`【${this.voteInfo.title}】选择的项已大于剩余可用${ableVoteCount}次，请重新选择`)
				} else {
					return true
				}
				this.otherObj = {}
				this.formData = {}
				return false
			},
			// 提示框
			handleShowModal(contentText, title = '提示') {
				uni.showModal({
					title: title,
					content: contentText,
					showCancel: false,
					confirmText: '确定',
					success: res => {},
					fail: () => {},
					complete: () => {}
				});
			},
			// 提交表单
			submit(ref) {

				// #ifdef MP-WEIXIN
				if (Object.keys(this.formData).length == 0) {
					this.handleShowModal('请回答所有问题后再提交')
					return false
				}
				let pass = true;
				for (let key in this.formData) {
					if (this.formData[key] == null || this.formData[key].length === 0) {
						pass = false
						this.handleShowModal('请回答所有问题后再提交')
						break;
					}
					
					let findId = this.otherItemIds.includes(this.formData[key]) || 
					(Array.isArray(this.formData[key]) && this.formData[key].find(id => this.otherItemIds.includes(id)))
					
					if (findId && !this.otherObj[key]) {
						pass = false
						this.handleShowModal('请在【其他】选项输入内容')
						break;
					}
				}
				
				if (pass) {
					let valueObjMp = Object.assign({}, this.formData);
					this.formFormat(valueObjMp)
					return this.submitForm(valueObjMp)
				}
				// #endif

				// #ifndef MP-WEIXIN
				this.$refs[ref].validate().then(valueObj => {
					// console.log('表单数据信息', valueObj);
					this.formFormat(valueObj)
					return this.submitForm(valueObj)
				}).catch(err => {
					console.log('err', err);
				})
				// #endif

			},
			formFormat(submitValue){
				for (let valueKey in submitValue) {
					// checkResult = this.checkSubmitValue(valueKey, submitValue[valueKey])
					
					// 包含其他项处理
					if (Array.isArray(submitValue[valueKey])) {
						// 多选
						submitValue[valueKey] = submitValue[valueKey].map(_id => {
							if (this.otherItemIds.includes(_id)) {
								return {
									_id,
									"input_value": this.otherObj[valueKey]
								}
							} else {
								return {
									_id
								}
							}
						})
					}else{
						// 单选
						if(this.otherItemIds.includes(submitValue[valueKey])){
							submitValue[valueKey] =  {
								_id:submitValue[valueKey],
								"input_value": this.otherObj[valueKey]
							}
						}else{
							submitValue[valueKey] =  {
								_id:submitValue[valueKey]
							}
						}
					}
				}
			},
			// 提交表单数据
			async submitForm(value) {
				let param = {
					vote_id: this.voteInfo._id,
					chooseData: value
				}
				
				await vote.handleVote(param).then((res) => {
					// console.log("res: ",res);
					this.voteConfig.ableVoteCount -= 1

					this.handleShowModal(`【${this.voteInfo.title}】${res.errMsg}`)
					if (this.voteConfig.ableVoteCount === 0) {
						this.showResult(value)
					} else {
						// #ifndef MP-WEIXIN
						for (let key in this.otherObj) {
							this.$set(this.otherObj, key, '')
						}
						this.formData = {}
						// #endif

						// #ifdef MP-WEIXIN
						this.otherObj = {}
						for (let key in this.formData) {
							if (Array.isArray(this.formData[key])) {
								this.formData[key] = []
							} else {
								this.formData[key] = ''
							}
						}
						// #endif
					}

				}).catch(err => {
					console.log(err);
				})
			},
			// 显示最后结果
			showResult(lastRecords) {
				let formData = {},otherObj={};
				if (Array.isArray(lastRecords)) {
					// 查到最后一次记录
					lastRecords.map(item => {
						// 多选
						if (Array.isArray(item.option_ids)) {
							let ids = item.option_ids.map(i => {
								if (this.otherItemIds.includes(i._id)) {
									otherObj[item.vote_question_id] = i.input_value
								}
								return i._id
							})
							formData[item.vote_question_id] = ids
						}else{
							// 单选
							formData[item.vote_question_id] = item.option_ids._id
							if (this.otherItemIds.includes(item.option_ids._id)) {
								otherObj[item.vote_question_id] = item.option_ids.input_value
							}
						}
						
					})
				}else{
					// 在次数用完了，显示最后一次内容
					for (let key in lastRecords) {
						// 多选
						if (Array.isArray(lastRecords[key])) {
							formData[key] = lastRecords[key].map(item => {
								if (this.otherItemIds.includes(item._id)) {
									otherObj[key] = item.input_value
								}
								return item._id
							})
						}else{
							// 单选
							formData[key] = lastRecords[key]._id
							if (this.otherItemIds.includes(lastRecords[key]._id)) {
								otherObj[key] = lastRecords[key].input_value
							}
						}
					}
				}
				this.formData = formData
				this.otherObj = otherObj
				this.dataCheckboxDisable()
				this.disable = true
			},
			dataCheckboxDisable() {
				this.dataList = this.dataList.map(item => {
					item.vote_items = item.vote_items.map(item => ({
						...item,
						disable: true
					}));
					return item;
				});
			}
		}
	}
</script>

<style scoped>
	page {
		background-color: #F8F8F8;
		flex: 1;
	}

	@media screen and (max-width:980px) {
		.vote-items-box {
			padding: 10px;
			height: calc(100vh - var(--status-bar-height));
		}
	}

	@media screen and (min-width:981px) {
		.vote-items-box {
			padding: 50px;
		}
	}

	.vote-items-box {
		overflow-y: scroll;
		flex-direction: column;
		display: flex;
		background-color: #F8F8F8 !important;
		/* #ifdef H5 */
		scrollbar-width: none;
		/* firefox */
		-ms-overflow-style: none;
		/* IE 10+ */
		overflow: -moz-scrollbars-none;
		/* #endif */
	}

	.date-status-text {
		color: #f27b07;
		font-weight: 600;
		margin-bottom: 20px;
	}

	.rule {
		padding: 10px;
		font-size: 12px;
		background-color: #fff4e7;
		border-radius: 5px;
		margin-bottom: 20px;
	}

	.question-list {
		margin-bottom: 20px;
	}

	.title {
		line-height: 30px;
		font-size: 16px;
	}

	.checkbox {
		font-size: 16px;
	}

	::v-deep .uni-data-checklist .checklist-group .checklist-box.is--list {
		padding: 15px 0 !important;
	}

	::v-deep .uni-data-checklist .checklist-group .checklist-box .radio__inner,
	::v-deep .uni-data-checklist .checklist-group .checklist-box .checkbox__inner {
		width: 20px;
		height: 20px;
		margin-right: 15px;
	}

	::v-deep .uni-data-checklist .checklist-group .checklist-box .checkbox__inner .checkbox__inner-icon {
		top: 2px;
		left: 7px;
		height: 10px;
	}

	.uni-data-checklist .checklist-group .checklist-box .checklist-content ::v-deep .checklist-text {
		font-size: 16px;
	}

	::v-deep .uni-data-checklist .checklist-group .is-list-border {
		border: none !important;
	}

	::v-deep .uni-forms-item {
		margin-bottom: 0;
	}

	.input {
		padding-left: 30px;
		height: 50px;
		border-radius: 10px;
		background-color: #FFFFFF;
	}

	.disable {
		background-color: #eee;
	}

	.submit-btn {
		width: 150px;
		margin-top: 50px;
	}
</style>