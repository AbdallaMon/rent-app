/**
 * تاب الشكاوى - يعرض جدول الشكاوي من العملاء
 * مرتبط بجدول Complaint
 */

import React, { useState, useEffect } from 'react';
import {
  Badge,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message
} from '../../ui/CustomComponents';

import {
  ReloadOutlined,
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MessageOutlined,
  EditOutlined
} from '../../icons/Icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ComplaintsTab = () => {
  const [loading, setLoading] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [statsData, setStatsData] = useState({
    total: 0,
    pending: 0,
    reviewing: 0,
    resolved: 0,
    rejected: 0
  });
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [detailsModal, setDetailsModal] = useState({ visible: false, record: null });
  const [responseForm] = Form.useForm();
  // جلب الشكاوى
  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/whatsapp/complaints');
      const result = await response.json();
      
      if (result.complaints) {
        setComplaints(result.complaints);
          // تحديث الإحصائيات
        const stats = {
          total: result.summary.total || 0,
          pending: result.summary.pending || 0,
          reviewing: result.summary.reviewing || 0,
          resolved: result.summary.resolved || 0,
          rejected: result.summary.rejected || 0
        };
        
        setStatsData(stats);
      }
    } catch (error) {
      console.error('Error loading complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
    
    // تحديث البيانات كل دقيقتين
    const interval = setInterval(fetchComplaints, 120000);
    return () => clearInterval(interval);
  }, []);

  // تصفية الشكاوى
  const filteredComplaints = complaints.filter(complaint => {
    let matchesSearch = true;
    let matchesStatus = true;
    let matchesCategory = true;
    
    if (searchText) {
      matchesSearch = 
        String(complaint.id).includes(searchText) || 
        String(complaint.clientId).includes(searchText) ||
        (complaint.title && complaint.title.includes(searchText)) ||
        (complaint.description && complaint.description.includes(searchText));
    }
    
    if (filterStatus !== 'all') {
      matchesStatus = complaint.status === filterStatus;
    }
    
    if (filterCategory !== 'all') {
      matchesCategory = complaint.category === filterCategory;
    }
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // عرض تفاصيل الشكوى
  const showDetailsModal = (record) => {
    setDetailsModal({
      visible: true,
      record
    });
    
    responseForm.setFieldsValue({
      status: record.status,
      responseText: record.responseText || ''
    });
  };

  // إغلاق النافذة
  const closeDetailsModal = () => {
    setDetailsModal({ visible: false, record: null });
  };

  // تحديث الشكوى والرد عليها
  const updateComplaint = async (values) => {
    try {
      const response = await fetch(`/api/admin/complaints/${detailsModal.record.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: values.status,
          responseText: values.responseText,
          responseDate: new Date().toISOString()
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        message.success('تم تحديث الشكوى بنجاح');
        closeDetailsModal();
        fetchComplaints(); // إعادة جلب البيانات
      } else {
        message.error(result.message || 'فشل في تحديث الشكوى');
      }
    } catch (error) {
      console.error('Error updating complaint:', error);
      message.error('فشل في تحديث الشكوى');
    }
  };

  // أعمدة جدول الشكاوى
  const columns = [
    {
      title: 'رقم الشكوى',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: 'العميل',
      dataIndex: 'clientId',
      key: 'client'
    },
    {
      title: 'العنوان',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true
    },
    {
      title: 'التصنيف',
      dataIndex: 'category',
      key: 'category',
      render: category => (
        <Tag color={
          category === 'MAINTENANCE_ISSUE' ? 'orange' : 
          category === 'RENT_ISSUE' ? 'green' : 
          category === 'PROPERTY_ISSUE' ? 'blue' : 
          category === 'NOISE_ISSUE' ? 'purple' : 
          category === 'SECURITY_ISSUE' ? 'red' : 
          category === 'NEIGHBOR_ISSUE' ? 'magenta' :
          category === 'PAYMENT_ISSUE' ? 'cyan' : 
          'default'
        }>
          {category}
        </Tag>
      )
    },
    {
      title: 'الحالة',
      dataIndex: 'status',
      key: 'status',
      render: status => (
        <Badge 
          status={
            status === 'PENDING' ? 'warning' : 
            status === 'REVIEWING' ? 'processing' : 
            status === 'RESOLVED' ? 'success' : 
            'error'
          } 
          text={status} 
        />
      )
    },
    {
      title: 'تاريخ التقديم',
      dataIndex: 'createdAt',
      key: 'date',
      render: date => new Date(date).toLocaleString('ar-SA')
    },
    {
      title: 'تم الرد؟',
      key: 'responded',
      render: (_, record) => (
        record.responseText ? 
        <Tag color="green">نعم</Tag> : 
        <Tag color="red">لا</Tag>
      )
    },
    {
      title: 'العمليات',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            size="small" 
            icon={<EyeOutlined />} 
            onClick={() => showDetailsModal(record)}
          >
            التفاصيل
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={24}>
          <Card>
            <Title level={4}>الشكاوى</Title>
            <Divider />
            
            <Row gutter={[16, 16]} justify="space-between" align="middle">
              <Col xs={24} md={16}>
                <Space>
                  <Button 
                    type="primary" 
                    icon={<ReloadOutlined />} 
                    onClick={fetchComplaints}
                    loading={loading}
                  >
                    تحديث
                  </Button>
                  
                  <Input 
                    placeholder="بحث"
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    prefix={<SearchOutlined />}
                    allowClear
                    style={{ width: 200 }}
                  />
                  
                  <Select
                    placeholder="تصفية حسب الحالة"
                    value={filterStatus}
                    onChange={value => setFilterStatus(value)}
                    style={{ width: 150 }}
                  >
                    <Option value="all">جميع الحالات</Option>
                    <Option value="PENDING">قيد الانتظار</Option>
                    <Option value="REVIEWING">قيد المراجعة</Option>
                    <Option value="RESOLVED">تم الحل</Option>
                    <Option value="REJECTED">مرفوض</Option>
                  </Select>
                  
                  <Select
                    placeholder="تصفية حسب التصنيف"
                    value={filterCategory}
                    onChange={value => setFilterCategory(value)}
                    style={{ width: 150 }}
                  >
                    <Option value="all">جميع التصنيفات</Option>
                    <Option value="PROPERTY_ISSUE">مشكلة بالعقار</Option>
                    <Option value="RENT_ISSUE">مشكلة بالإيجار</Option>
                    <Option value="NEIGHBOR_ISSUE">مشكلة مع الجيران</Option>
                    <Option value="MAINTENANCE_ISSUE">مشكلة صيانة</Option>
                    <Option value="NOISE_ISSUE">مشكلة ضوضاء</Option>
                    <Option value="SECURITY_ISSUE">مشكلة أمنية</Option>
                    <Option value="PAYMENT_ISSUE">مشكلة دفع</Option>
                    <Option value="OTHER">أخرى</Option>
                  </Select>
                </Space>
              </Col>
            </Row>
            
            <Divider />
            
            <Row gutter={[16, 16]} className="mb-4">
              <Col xs={24} sm={12} md={6} lg={4}>
                <Card size="small">
                  <Statistic
                    title="إجمالي الشكاوى"
                    value={statsData.total}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              
              <Col xs={24} sm={12} md={6} lg={4}>
                <Card size="small">
                  <Statistic
                    title="قيد الانتظار"
                    value={statsData.pending}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              
              <Col xs={24} sm={12} md={6} lg={4}>
                <Card size="small">
                  <Statistic
                    title="قيد المراجعة"
                    value={statsData.reviewing}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
              
              <Col xs={24} sm={12} md={6} lg={4}>
                <Card size="small">
                  <Statistic
                    title="تم الحل"
                    value={statsData.resolved}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              
              <Col xs={24} sm={12} md={6} lg={4}>
                <Card size="small">
                  <Statistic
                    title="مرفوض"
                    value={statsData.rejected}
                    valueStyle={{ color: '#f5222d' }}
                  />
                </Card>
              </Col>
            </Row>
            
            <Table 
              columns={columns} 
              dataSource={filteredComplaints} 
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: true }}
            />
          </Card>
        </Col>
      </Row>

      {/* نافذة تفاصيل ورد على الشكوى */}
      <Modal
        title={`تفاصيل الشكوى رقم ${detailsModal.record?.id}`}
        open={detailsModal.visible}
        onCancel={closeDetailsModal}
        footer={null}
        width={700}
      >
        {detailsModal.record && (
          <>
            <Divider orientation="right">معلومات الشكوى</Divider>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>رقم العميل: </Text>
                <Text>{detailsModal.record.clientId}</Text>
              </Col>
              <Col span={12}>
                <Text strong>تصنيف الشكوى: </Text>
                <Text>{detailsModal.record.category}</Text>
              </Col>
              <Col span={12}>
                <Text strong>تاريخ التقديم: </Text>
                <Text>{new Date(detailsModal.record.createdAt).toLocaleString('ar-SA')}</Text>
              </Col>
              <Col span={12}>
                <Text strong>حالة الشكوى: </Text>
                <Badge 
                  status={
                    detailsModal.record.status === 'PENDING' ? 'warning' : 
                    detailsModal.record.status === 'REVIEWING' ? 'processing' : 
                    detailsModal.record.status === 'RESOLVED' ? 'success' : 'error'
                  } 
                  text={detailsModal.record.status} 
                />
              </Col>
              <Col span={24}>
                <Text strong>العنوان: </Text>
                <br />
                <Text>{detailsModal.record.title}</Text>
              </Col>
              <Col span={24}>
                <Text strong>الوصف: </Text>
                <br />
                <Text>{detailsModal.record.description}</Text>
              </Col>
              {detailsModal.record.attachments && (
                <Col span={24}>
                  <Text strong>المرفقات: </Text>
                  <br />
                  <Text>{detailsModal.record.attachments}</Text>
                </Col>
              )}
            </Row>
            
            <Divider orientation="right">الرد على الشكوى</Divider>
            <Form
              form={responseForm}
              layout="vertical"
              onFinish={updateComplaint}
            >
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Form.Item
                    name="status"
                    label="تحديث الحالة"
                  >
                    <Select>
                      <Option value="PENDING">قيد الانتظار</Option>
                      <Option value="REVIEWING">قيد المراجعة</Option>
                      <Option value="RESOLVED">تم الحل</Option>
                      <Option value="REJECTED">مرفوض</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="responseText"
                    label="نص الرد"
                  >
                    <TextArea rows={4} />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Space>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      icon={<MessageOutlined />}
                    >
                      إرسال الرد
                    </Button>
                    <Button onClick={closeDetailsModal}>
                      إلغاء
                    </Button>
                  </Space>
                </Col>
              </Row>
            </Form>
          </>
        )}
      </Modal>
    </div>
  );
};

// إضافة معلومات وصفية للمكون
ComplaintsTab.info = {
  title: 'الشكاوى',
  icon: 'ExclamationCircleOutlined'
};

export default ComplaintsTab;
