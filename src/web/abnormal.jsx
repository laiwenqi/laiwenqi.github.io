import React from 'react';
import reqwest from 'reqwest';
import PubSub from 'pubsub-js';
import { DatePicker,Row,Col,Form,Checkbox,Table,Modal,InputNumber,Input,Popconfirm,Icon, Button,Dropdown,Popover,Select,Tabs } from 'antd';
import classNames from 'classnames';
import web_config from '../function/config.js';
import commonFunction from '../function/function.js';
import AbnormalSearch from './abnormal_search.jsx';
import './abnormal.less';
const FormItem = Form.Item;
const createForm = Form.create;
const InputGroup = Input.Group;
const confirm = Modal.confirm;
const RangePicker = DatePicker.RangePicker;

//页面名称
const PageName='abnormal'+Date.parse(new Date());

//定义服务类型
let servicetype=[];

//定义处理状态
const ABTB_STATUS=[
             { text: '继续交易', value:'0'},
             { text: '换卡交易', value:'5'},
             { text: '停止交易，退款', value:'9'}
             ];

const ABTB_STATUS_LIST=ABTB_STATUS.map(function(item){
    return (<Option value={String(item.value)} >{item.text}</Option>)
});


//定义交易状态
const ABTD_STATUS=[
            { text: '正常交易', value:'0'},
            { text: '服务器交易失败', value:'1'},
            { text: '终端交易失败', value:'2'},
            { text: '后台交易，未完成', value:'3'},
            { text: '有疑问交易', value:'4'},
            { text: '撤销交易退款', value:'9'}];

const ABTD_STATUS_LIST=ABTD_STATUS.map(function(item){
  return (<Option value={String(item.value)} >{item.text}</Option>)
});

//指定表格每列内容
const columns = [{
  title: '交易卡号',
  dataIndex: 'ABTD_TARGET'
},{
  title: '终端交易流水',
  dataIndex: 'ABTD_TERM_SN'
},{
  title: '终端名',
  dataIndex: 'DEV_NAME'
},{
  title: '交易金额（元）',
  dataIndex: 'ABTD_AMOUNT',
  render(text, row, index) {
    return row.ABTD_AMOUNT;
  }
},{
  title: '交易时间',
  dataIndex: 'ABTD_TIME',
  render(text, row, index) {
    return commonFunction.formatTime(row.ABTD_TIME,"yyyy-MM-dd hh:mm:ss");
  }
},{
  title: '是否已处理',
  dataIndex: 'ABTD_IF_DONE',
  render(text, row, index) {
    return row.ABTD_IF_DONE==0?"未处理":"已处理";
  }
},{
  title: '操作',
  key: 'operation',
  render(text, row, index) {
    return (
      /* 把所在的行的数据传递下去 */
      <Edit {...row}/>
      );
    }
}];





//这里是默认简易的搜索
const SearchInput = React.createClass({
  getInitialState() {
    return {
      FILTER_KEY: '',
      focus: false,
    };
  },
  componentDidMount() {
    // 订阅 重置 的事件
    PubSub.subscribe(PageName+"Reset",this.handleReset);
  },
  componentWillUnmount(){
    //退订事件
    PubSub.unsubscribe(PageName+'Reset');
  },
  handleReset(){
    this.setState({
      FILTER_KEY:''
    });
  },
  handleInputChange(e) {
    this.setState({
      FILTER_KEY: e.target.value,
    });
  },
  handleFocusBlur(e) {
    this.setState({
      focus: e.target === document.activeElement,
    });
  },
  handleSearch(e) {
    let params={};
    params.FILTER_KEY=this.state.FILTER_KEY.trim();
    params.type="defaultSearch";
    if (this.props.onSearch) {
      this.props.onSearch(params);
    }
  },
  render() {
    const btnCls = classNames({
      'ant-search-btn': true,
      'ant-search-btn-noempty': !!this.state.FILTER_KEY.trim(),
    });
    const searchCls = classNames({
      'ant-search-input': true,
      'ant-search-input-focus': this.state.focus,
    });
    return (
      <InputGroup className={searchCls} style={this.props.style}>
        <Input {...this.props} value={this.state.FILTER_KEY} onChange={this.handleInputChange}
          onFocus={this.handleFocusBlur} onBlur={this.handleFocusBlur} />
          <div className="ant-input-group-wrap">
            <Button className={btnCls} size={this.props.size} onClick={this.handleSearch}>
              <Icon type="search" />
            </Button>
          </div>
        </InputGroup>
    );
  }
});





//这里是高级的搜索
let FilterLayer = React.createClass({
  getInitialState() {
    return {
    };
  },
  componentDidMount() {
    // 订阅 重置 的事件
    PubSub.subscribe(PageName+"Reset",this.handleButtonReset);
  },
  componentWillUnmount(){
    //退订事件
    PubSub.unsubscribe(PageName+'Reset');
  },
  handleButtonReset() {
    this.props.form.resetFields();
  },
  handleSubmit(e) {
    e.preventDefault();
    let params=this.props.form.getFieldsValue();
    params.type='moreSearch';
    if(typeof params.FILTER_TARDE_DATE!='undefined'){
      params.FILTER_S_TIME=commonFunction.formatTime(params.FILTER_TARDE_DATE[0],'yyyy-MM-dd hh:mm:ss');
      params.FILTER_E_TIME=commonFunction.formatTime(params.FILTER_TARDE_DATE[1],'yyyy-MM-dd hh:mm:ss');
    }
    this.props.search(params);
    this.props.fliterhide();
  },
  handleReset(e) {
    e.preventDefault();
    this.props.form.resetFields();
  },
  render() {
    const { getFieldProps } = this.props.form;
    return (
      <Form  inline onSubmit={this.handleSubmit} >
        <FormItem
          label="交易时间：">
          <RangePicker showTime format="yyyy/MM/dd HH:mm:ss" {...getFieldProps('FILTER_TARDE_DATE')} />
        </FormItem>
        <br/>
        <FormItem
          label="交易卡号：">
          <Input placeholder="请输入交易卡号搜索" {...getFieldProps('FILTER_ABTD_TARGET')} style={{ width: 340 }}/>
        </FormItem>
        <div style={{ textAlign: 'right' }}>
            <Button size="small" type="primary" htmlType="submit">搜索</Button>
            <Button style={{ marginLeft: '10px' }} size="small" onClick={this.handleReset}>清除条件</Button>
        </div>
      </Form>
    );
  }
});
FilterLayer = Form.create()(FilterLayer);







//点击操作编辑 弹窗内容
let ModalContent =React.createClass({
  getInitialState() {
    return {
      loading:false,//确定按钮状态
      nochangecontentV:this.props.contentValue,//这个用来对比是不是和原来的值一样，暂时用这个办法
      contentV:this.props.contentValue,
      ABTD_TARGET:{
        DISABLED:true,
        VISABLE:true
      }
    }
  },
  componentWillReceiveProps(){
    //每次打开还原表单的值
    if(this.props.visible==false){
      this.props.form.resetFields();
    }
  },
  handleSubmit(e) {
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((errors, values) => {
      if (!!errors) {
        console.log('表单没通过验证');
        return;
      }
        /*判断弹窗表单值是否有改变，没有就不发布更新*/
       /*！！两个对象长度不等可能会导致不正确判断*/
       let hasChanged=0; /*0表示没有改变*/
       if(values.ABTD_DONE_STATUS!=this.state.nochangecontentV.ABTD_DONE_STATUS){
         hasChanged=1;
       }
       if(values.ABTD_TARGET!=this.state.nochangecontentV.ABTD_TARGET){
         hasChanged=1;
       }
       if(values.ABTD_REASON!=this.state.nochangecontentV.ABTD_REASON){
         hasChanged=1;
       }
       if(hasChanged==0){
         this.handleCancel();
         return;
       }

       //根据处理状态选择
      let url;
      let params;
      if(values.ABTD_DONE_STATUS=="9"){
        url='/proc/abnormal/continue';
        params=commonFunction.objExtend({
         ABTD_ID:this.state.nochangecontentV.ABTD_ID,
         TDDT_TERM_SN:this.state.nochangecontentV.ABTD_TERM_SN,
         url:url
        },values);
      }else{
        url='/proc/abnormal/refund';
        params=commonFunction.objExtend({
         ABTD_ID:this.state.nochangecontentV.ABTD_ID,
         url:url,
         DEV_SN:this.state.nochangecontentV.DEV_SN,
         RVDT_PYMN_SN:'',
         PYMN_SN:this.state.nochangecontentV.PYMN_SN,
         RVDT_TERM_SN:'',
         TDDT_TERM_SN:this.state.nochangecontentV.ABTD_TERM_SN,
         RVDT_AMOUNT:this.state.nochangecontentV.ABTD_AMOUNT,
         RVDT_TRADE_TIME:commonFunction.formatTime(this.state.contentV.ABTD_TIME,"yyyy-MM-dd hh:mm:ss"),
         RVDT_REASON: 'ABNORMAL_REFUND',
         ABTD_STATUS: this.state.nochangecontentV.ABTD_STATUS,
         RVDT_REASON_DESC: '异常交易退款',
         FLAG:this.state.nochangecontentV.ABTD_IF_DONE
        },values);
      }

      //发布 编辑 事件
      this.state.loading=true;
      this.props.modalClose();
      PubSub.publish(PageName+"Edit",params);
    });
  },
  handleCancel() {
    this.props.modalClose();
  },
  getValidateStatus(field) {
   const { isFieldValidating, getFieldError, getFieldValue } = this.props.form;
   if (isFieldValidating(field)) {
     return 'validating';
   } else if (!!getFieldError(field)) {
     return 'error';
   } else if (getFieldValue(field)) {
     return 'success';
   }
 },
 ABTD_DONE_STATUS_CHANGE(value){
   switch(value){
     case '0':
      this.setState({
        ABTD_TARGET:{
          DISABLED:true,
          VISABLE:true
        }
      });
     break;
     case '5':
      this.setState({
        ABTD_TARGET:{
          DISABLED:false,
          VISABLE:true
        }
      });
     break;
     case '9':
      this.setState({
        ABTD_TARGET:{
          DISABLED:true,
          VISABLE:false
        }
      });
     break;
   }
 },
 render() {
     const { getFieldProps, getFieldError, isFieldValidating } = this.props.form;

     let input_kahao=(<div className='el-display-none'></div>);

     if(this.state.ABTD_TARGET.VISABLE){
         input_kahao=(
           <FormItem label="充值卡号： " >
           <Input  disabled={this.state.ABTD_TARGET.DISABLED} placeholder="请输入充值卡号" {...getFieldProps('ABTD_TARGET',{
               rules: [{ required: true,whitespace:true, message: '请输入充值卡号' }],
               initialValue:this.state.contentV.ABTD_TARGET
           })} style={{ width: 230 }}/>
           </FormItem>
     )};

     return (
       /*表单下拉组件 的 value 一定要全等，才能正确显示*/
       <Form inline form={this.props.form}>
       <div className="abnormalDetailLayer">
       <FormItem label="交易卡号："  style={{ width: 200 }}>
         <div className="item-highlight" >{this.state.contentV.ABTD_TARGET}</div>
       </FormItem>
       <FormItem label="交易流水："  style={{ width: 200 }}>
         <div className="item-highlight">{this.state.contentV.ABTD_TERM_SN}</div>
       </FormItem>
       <FormItem label="交易时间："  style={{ width: 200 }}>
         <div  className="item-highlight">{commonFunction.formatTime(this.state.contentV.ABTD_TIME,"yyyy-MM-dd hh:mm:ss")}</div>
       </FormItem>
       </div>
       <hr className="hr"/>
      <div style={{marginLeft:100}}>
       <FormItem label="处理状态： ">
         <Select id="select" size="large" placeholder="请选择处理状态" {...getFieldProps('ABTD_DONE_STATUS',{
             rules: [{ required: true, message: '请选择处理状态' }],
             initialValue:this.state.contentV.ABTD_DONE_STATUS || "0",
             onChange:this.ABTD_DONE_STATUS_CHANGE
         })} style={{ width: 230 }}>
          { ABTB_STATUS_LIST }
         </Select>
       </FormItem>
       { input_kahao }
       <FormItem
         id="control-textarea"
         label="&nbsp;&nbsp;&nbsp;&nbsp;处理原因：">
         <Input type="textarea" rows="5" placeholder="请填写处理原因" {...getFieldProps('ABTD_REASON',{
             rules: [{max: 128, message: '处理原因至多为 128 个字符'}],
             initialValue:this.state.contentV.ABTD_REASON
         })} style={{ width: 230 }}/>
       </FormItem>
       </div>
       <div className="ant-modal-footer FormItem-modal-footer">
            <Button type="ghost" className="ant-btn ant-btn-ghost ant-btn-lg" onClick={this.handleCancel} >取消</Button>
            <Button type="primary" className="ant-btn ant-btn-primary ant-btn-lg" onClick={this.handleSubmit} loading={this.state.loading}>确定</Button>
        </div>
       </Form>
     )
   }
});
ModalContent = Form.create()(ModalContent);




//点击操作 详情 弹窗内容
let DetailContent =React.createClass({
  getInitialState() {
    return {
      loading:false,//确定按钮状态
      nochangecontentV:this.props.contentValue,//这个用来对比是不是和原来的值一样，暂时用这个办法
      contentV:this.props.contentValue
    }
  },
  componentWillReceiveProps(){
    //每次打开还原表单的值
    if(this.props.visible==false){
      this.props.form.resetFields();
    }
  },
  handleCancel() {
    this.props.modalClose();
  },
  render() {
     const { getFieldProps, getFieldError, isFieldValidating } = this.props.form;
     let jiaoyi_status="暂无"; //交易状态
     let fuwu_type="暂无"; //服务类型
     let chuli_status="暂无"; //处理状态
     for(let i=0;i<ABTD_STATUS.length;i++){
         if(this.state.contentV.ABTD_STATUS==ABTD_STATUS[i].value){
             jiaoyi_status=ABTD_STATUS[i].text;
             break;
         }
     }
     for(let i=0;i<servicetype.length;i++){
         if(this.state.contentV.TMSV_CODE_NUM==servicetype[i].value){
             fuwu_type=servicetype[i].TMSV_NAME;
             break;
         }
     }
     for(let i=0;i<ABTB_STATUS.length;i++){
         if(this.state.contentV.ABTD_DONE_STATUS==ABTB_STATUS[i].value){
             chuli_status=ABTB_STATUS[i].text;
             break;
         }
     }
     return (
       /*表单下拉组件 的 value 一定要全等，才能正确显示*/
       <Form inline form={this.props.form}>
       <div className="abnormalDetailLayer">
       <FormItem label="处理状态："  style={{ width: 200 }}>
         <div className="item-highlight" >{ chuli_status }</div>
       </FormItem>
       <FormItem label="支付流水："  style={{ width: 200 }}>
         <div >{this.state.contentV.PYMN_SN==null||this.state.contentV.PYMN_SN?"暂无":this.state.contentV.PYMN_SN}</div>
       </FormItem>
       <FormItem label="商户交易流水："  style={{ width: 200 }}>
         <div  className="item-highlight">{this.state.contentV.ABTD_MERCHANT_SN==null||this.state.contentV.ABTD_MERCHANT_SN==""?"暂无":this.state.contentV.ABTD_MERCHANT_SN}</div>
       </FormItem>
       <FormItem label="终端序列："  style={{ width: 200 }}>
         <div  className="item-highlight">{this.state.contentV.DEV_SN}</div>
       </FormItem>
       <FormItem label="服务类型："  style={{ width: 200 }}>
         <div  className="item-highlight">{ fuwu_type }</div>
       </FormItem>
       <FormItem label="交易状态："  style={{ width: 200 }}>
         <div  className="item-highlight">{ jiaoyi_status }</div>
       </FormItem>
       <FormItem label="处理帐号："  style={{ width: 200 }}>
         <div  className="item-highlight">{this.state.contentV.OPER_ACCOUNT==null||this.state.contentV.OPER_ACCOUNT==""?"暂无":this.state.contentV.OPER_ACCOUNT}</div>
       </FormItem>
       <FormItem label="处理时间："  style={{ width: 200 }}>
         <div  className="item-highlight">{this.state.contentV.ABTD_DONE_TIME==null||this.state.contentV.ABTD_DONE_TIME==""?"暂无":commonFunction.formatTime(this.state.contentV.ABTD_DONE_TIME,"yyyy-MM-dd hh:mm:ss")}</div>
       </FormItem>
       <FormItem label="终端地址："  style={{ width: 400 }}>
         <div  className="item-highlight">{
           (this.state.DEV_PROVINCE+this.state.DEV_CITY+this.state.DEV_COUNTY+this.state.DEV_TOWN+this.state.DEV_VILLAGE+this.state.DEV_ROAD+this.state.DEV_DOORPLATE+this.state.DEV_BUILDING) ? (this.state.DEV_PROVINCE+this.state.DEV_CITY+this.state.DEV_COUNTY+this.state.DEV_TOWN+this.state.DEV_VILLAGE+this.state.DEV_ROAD+this.state.DEV_DOORPLATE+this.state.DEV_BUILDING)
           :"暂无"
         }</div>
       </FormItem>
       <FormItem label="处理原因："  style={{ width: 400 }}>
         <div  className="item-highlight">{this.state.contentV.ABTD_REASON==null||this.state.contentV.ABTD_REASON==""?"暂无":this.state.contentV.ABTD_REASON}</div>
       </FormItem>
       </div>
       <div className="ant-modal-footer FormItem-modal-footer">
            <Button type="primary" className="ant-btn ant-btn-primary ant-btn-lg" onClick={this.handleCancel} >确定</Button>
        </div>
       </Form>
     )
   }
});
DetailContent = Form.create()(DetailContent);


//表格操作栏
const Edit = React.createClass({
  getInitialState() {
    return {
      loading: false,
      HandleVisible: false,
      DetailVisible: false
    };
  },
  handleCancel(){
    this.setState({
      HandleVisible: false
    });
  },
  detailCancel(){
    this.setState({
      DetailVisible: false
    });
  },
  showHandle() {
    this.setState({
      HandleVisible: true
    });
  },
  showDetail() {
    this.setState({
      DetailVisible: true
    });
  },

  render() {
    return (
      <div>
        <a type="primary" onClick={this.showHandle} {...this.props}>处理异常</a>
          <span className="ant-divider"></span>
        <a type="primary" onClick={this.showDetail}>详情</a>
        <Modal ref="modal"
          width="550"
          visible={this.state.HandleVisible}
          title={'处理异常-终端交易流水'+this.props.ABTD_TERM_SN}
          onCancel={this.handleCancel}
          footer={null} >
          <ModalContent
            modalClose={this.handleCancel} //传递取消事件
            contentValue={this.props}  //传递表单的值
            visible={this.state.HandleVisible}
            />
        </Modal>
        <Modal ref="modal"
          width="550"
          visible={this.state.DetailVisible}
          title={'详情-终端交易流水'+this.props.ABTD_TERM_SN}
          onCancel={this.detailCancel}
          footer={null} >
          <DetailContent
            modalClose={this.detailCancel} //传递取消事件
            contentValue={this.props}  //传递表单的值
            visible={this.state.DetailVisible}
            />
        </Modal>
      </div>
    );
  }
});





//标签分页里面的整个内容
const Abnormal= React.createClass({
   getInitialState() {
    return {
      data: [],
      defaultFilter:{},
      moreFilter:{},
      pagination: {
        pageSize:10, //每页显示数目
        total:0,//数据总数
        current:1,//页数
        size:'large',
        showTotal:function showTotal(total) {
            return `共 ${total} 条记录`;
        },
        showQuickJumper:true,
        // showSizeChanger :true
      },
      loading: false,
      gaojisousuoVislble:false,
      Search:{
        visible:false,
        params:{}
      }
    };
  },
  handleTableChange(pagination, filters, sorter) {
    const pager = this.state.pagination;
    pager.current = pagination.current;
    this.setState({
      pagination: pager
    });
    const params = {
      type:'tableOnChange',
      pageSize: pagination.pageSize,
      current: pagination.current,
      sortField: sorter.field,
      sortOrder: sorter.order
    };
    for (let key in filters) {
      if (filters.hasOwnProperty(key)) {
        params[key] = filters[key];
      }
    }
    this.fetchList(params);
  },
  fetchList(params = {}) {
    switch (params.type) {
      case undefined:
      case 'undefined':
        params=commonFunction.objExtend(params,this.state.pagination);
        break;
      case 'defaultSearch': //默认搜索行为
        this.state.defaultFilter=commonFunction.filterParamsObj(params);
        params=commonFunction.objExtend(params,this.state.moreFilter);
        params=commonFunction.objExtend(params,{
          pageSize:10, //每页显示数目
          current:1//页数
        });
        break;
      case 'moreSearch':    //高级搜索行为
        this.state.moreFilter=commonFunction.filterParamsObj(params);
        params=commonFunction.objExtend(params,this.state.defaultFilter);
        params=commonFunction.objExtend(params,{
          pageSize:10, //每页显示数目
          current:1//页数
        });
        break;
      case 'tableOnChange'://翻页排序等行为
        this.state.pagination={
          pageSize:params.pageSize,
          current:params.currentPage,
          sortField:params.sortField,
          sortOrder:params.sortOrder
        };
        params=commonFunction.objExtend(params,this.state.moreFilter);
        params=commonFunction.objExtend(params,this.state.defaultFilter);
        break;
      default:
        params=commonFunction.objExtend({},params);
    }
    this.setState({ loading: true });
    reqwest({
      url:web_config.http_request_domain+'/proc/abnormal/list',
      method: 'POST',
      timeout :web_config.http_request_timeout,
      data:params,
      crossOrigin: web_config.http_request_cross, //跨域
      type: "json",
      success: (result) => {
        if(result.data.ERROR!=0){
          commonFunction.MessageTip(result.data.MSG,2,'error');
          this.setState({
            loading: false
          });
          return;
        }
        const pagination = this.state.pagination;
        pagination.total = result.data.O_T_ABNORMAL_TRADE.count;
        pagination.current = result.data.O_T_ABNORMAL_TRADE.currentPage;
        servicetype=result.data.O_T_TERM_SERVICE;
        this.setState({
          loading: false,
          data: result.data.O_T_ABNORMAL_TRADE.data,
          pagination,
        });
      },
      error:()=>{
        commonFunction.MessageTip('获取数据失败',2,'error');
        this.setState({
          loading: false
        });
      }
    });
  },
  fetchEdit(evtName,data){
    let editParams=commonFunction.objExtend({},data);
    let listParams=commonFunction.objExtend({},this.state.defaultFilter);
    listParams=commonFunction.objExtend(listParams,this.state.moreFilter);
    listParams=commonFunction.objExtend(listParams,this.state.pagination);
    this.setState({ loading: true });
    reqwest({
      url:web_config.http_request_domain+editParams.url,
      method: 'POST',
      timeout :web_config.http_request_timeout,
      data:editParams,
      crossOrigin: web_config.http_request_cross, //跨域
      type: "json",
      success: (result) => {
        if(result.data.ERROR!=0){
          commonFunction.MessageTip(result.data.MSG,2,'error');
          this.setState({
            loading: false
          });
          return;
        }
        result.data.ERROR==0&&commonFunction.MessageTip('交易流水'+editParams.TDDT_TERM_SN+'，处理异常成功',2,'success');
        this.setState({
          loading: false
        });
        this.fetchList(listParams);
      },
      error:()=>{
        commonFunction.MessageTip('交易流水'+editParams.TDDT_TERM_SN+'，处理异常失败',2,'error');
        this.fetchList(listParams);
      }
    });
  },
  componentDidMount() {
    this.fetchList();
    // 订阅 编辑 的事件
    PubSub.subscribe(PageName+"Edit",this.fetchEdit);
  },
  componentWillUnmount(){
    //退订事件
    PubSub.unsubscribe(PageName+"Edit");
  },
  filterDisplay(){
    this.setState({
      gaojisousuoVislble:!this.state.gaojisousuoVislble
    });
  },
  fliterDisplayChange(e){
    this.setState({
      gaojisousuoVislble:e
    });
  },
  resetSearch(){
    this.setState({
      defaultFilter:{},
      moreFilter:{},
      pagination: {
        pageSize:10, //每页显示数目
        total:0,//数据总数
        current:1,//页数
        size:'large',
        showTotal:function showTotal(total) {
            return `共 ${total} 条记录`;
        },
        showQuickJumper:true
      }
    });
    PubSub.publish(PageName+"Reset",{});
    this.fetchList({
      type:'reset',
      pageSize:10,
      current:1
    });
  },
  handleSearch(){
    PubSub.unsubscribe(PageName+"Edit");
    this.setState({
      Search:{
        visible:true,
        params:''
      }
    });
  },
  render() {
    if(this.state.Search.visible==true){
      return (<AbnormalSearch {...this.state.Search.params}/>)
    }
    const FilterLayerContent= (
      <FilterLayer search={this.fetchList} fliterhide={this.filterDisplay}/>
    );
    return (
    <div>
     <Row>
      <Col span="4"><SearchInput placeholder="输入终端交易流水搜索" onSearch={this.fetchList} /> </Col>
      <Col span="2" style={{marginLeft:-10}} >
        <Popover placement="bottom" visible={this.state.gaojisousuoVislble} onVisibleChange={this.fliterDisplayChange} overlay={FilterLayerContent} trigger="click">
            <Button type="primary" htmlType="submit" className="gaojibtn" >高级搜索</Button>
        </Popover>
      </Col>
      <Col span="1" style={{marginLeft:-20}}>
        <Button type="primary" htmlType="submit" onClick={this.resetSearch} >重置</Button>
      </Col>
        <Col span="12" className="table-add-layer"><span className="table-add-btn Alink" onClick={this.handleSearch} >(异常交易历史查询)</span></Col>
      </Row>
        <div className="margin-top-10"></div>
        <Table columns={columns}
            dataSource={this.state.data}
            pagination={this.state.pagination}
            loading={this.state.loading}
            onChange={this.handleTableChange} /*翻页 筛选 排序都会触发 onchange*/
            size="middle"
            rowKey={record => record.ABTD_ID} /*指定每行的主键 不指定默认key*/
            bordered={true}
        />
   </div>
    );
  }
});



export default Abnormal;
