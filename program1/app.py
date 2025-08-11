import streamlit as st

# 设置页面标题
st.title('家庭保险规划助手 (智保规划)')

# 添加一些文本
st.write('您好！我将通过几个简单的问题，快速为您生成一份家庭保障健康诊断卡。')

# 添加一个侧边栏
with st.sidebar:
    st.header('侧边栏')
    name = st.text_input('请输入您的名字')
    if name:
        st.write(f'你好，{name}！')

# 添加一级标题和表单组件
st.header('# 第一步：请提供您的基本信息')

# 添加数字输入框 - 家庭年收入
income = st.number_input('您的家庭年收入（万元）:', min_value=0.0, format='%.2f')

# 添加数字输入框 - 家庭总负债
debt = st.number_input('您的家庭总负债（如房贷、车贷）（万元）:', min_value=0.0, format='%.2f')

# 添加下拉选择框 - 抚养子女数量
children_num = st.selectbox('您的家庭有几个需要抚养的子女？', options=[0, 1, 2, '3个或以上'])

# 添加诊断卡生成按钮
if st.button('生成我的诊断卡'):
    st.success('您的家庭保障诊断卡已生成！')

# 添加一个按钮
if st.button('点击我'):
    st.balloons()

# 添加一个滑块
age = st.slider('选择您的年龄', 0, 100, 25)
st.write(f'您选择的年龄是: {age}')

# 显示一些数据
import pandas as pd
import numpy as np

# 创建示例数据
data = pd.DataFrame({
    '姓名': ['张三', '李四', '王五', '赵六'],
    '年龄': [25, 30, 35, 40],
    '城市': ['北京', '上海', '广州', '深圳']
})

# 显示数据表格
st.subheader('数据表格示例')
st.dataframe(data)

# 显示图表
st.subheader('图表示例')
chart_data = pd.DataFrame(np.random.randn(20, 3), columns=['A', 'B', 'C'])
st.line_chart(chart_data)

# 添加一个复选框
if st.checkbox('显示更多信息'):
    st.info('这是一个使用Streamlit构建的简单Web应用示例。')
    st.info('Streamlit使Python开发者能够快速创建交互式Web应用。')