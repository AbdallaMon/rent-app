/**
 * تاب طلبات الصيانة - يعرض جدول طلبات الصيانة
 * مرتبط بجدول MaintenanceRequest
 */

import React, { useState, useEffect } from 'react';
import {
  Badge,
  Button,
  Card,
  Checkbox,
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
  Typography
} from '../../ui/CustomComponents';

import {
  ReloadOutlined,
  SearchOutlined,
  FilterOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SendOutlined,
  EditOutlined
} from '../../icons/Icons';

const { Title, Text } = Typography;
const { Option } = Select;

const MaintenanceTab = () => {
  const [loading, setLoading] = useState(false);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [statsData, setStatsData] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    rejected: 0
  });
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [detailsModal, setDetailsModal] = useState({ visible: false, record: null });
  const [updateForm] = Form.useForm();
  // جلب طلبات الصيانة
  const fetchMaintenanceRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/whatsapp/requests');
      const result = await response.json();
      
      if (result.requests) {
        setMaintenanceRequests(result.requests);
          // تحديث الإحصائيات
        const stats = {
          total: result.summary.total || 0,
          pending: result.summary.pending || 0,
          inProgress: result.summary.inProgress || 0,
          completed: result.summary.completed || 0,
          rejected: 0
        };
        
        setStatsData(stats);
      }
    } catch (error) {
      console.error('Error loading maintenance requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaintenanceRequests();
    
    // تحديث البيانات كل دقيقتين
    const interval = setInterval(fetchMaintenanceRequests, 120000);
    return () => clearInterval(interval);
  }, []);

  // تصفية طلبات الصيانة
  const filteredRequests = maintenanceRequests.filter(request => {
    let matchesSearch = true;
    let matchesStatus = true;
    let matchesPriority = true;
    
    if (searchText) {
      matchesSearch = 
        String(request.id).includes(searchText) || 
        String(request.clientId).includes(searchText) ||
        (request.description && request.description.includes(searchText));
    }
    
    if (filterStatus !== 'all') {
      matchesStatus = request.status === filterStatus;
    }
    
    if (filterPriority !== 'all') {
      matchesPriority = request.priority === filterPriority;
    }
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // عرض تفاصيل طلب الصيانة
  const showDetailsModal = (record) => {
    setDetailsModal({
      visible: true,
      record
    });
    
    updateForm.setFieldsValue({
      status: record.status,
      priority: record.priority,
      technicianNotified: record.technicianNotified
    });
  };

  // إغلاق النافذة
  const closeDetailsModal = () => {
    setDetailsModal({ visible: false, record: null });
  };

  // تحديث حالة طلب الصيانة
  const updateMaintenanceRequest = async (values) => {
    try {
      const response = await fetch(`/api/admin/maintenance-requests/${detailsModal.record.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });
      
      const result = await response.json();
      
      if (result.success) {
        message.success('تم تحديث طلب الصيانة بنجاح');
        closeDetailsModal();
        fetchMaintenanceRequests(); // إعادة جلب البيانات
      } else {
        message.error(result.message || 'فشل في تحديث طلب الصيانة');
      }
    } catch (error) {
      console.error('Error updating maintenance request:', error);
      message.error('فشل في تحديث طلب الصيانة');
    }
  };

  // إرسال إشعار إلى الفني
  const notifyTechnician = async (id) => {
    try {
      const response = await fetch(`/api/admin/maintenance-requests/${id}/notify-technician`, {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (result.success) {
        message.success('تم إرسال إشعار للفني بنجاح');
        fetchMaintenanceRequests(); // إعادة جلب البيانات
      } else {
        message.error(result.message || 'فشل في إرسال الإشعار');
      }
    } catch (error) {
      console.error('Error notifying technician:', error);
      message.error('فشل في إرسال الإشعار');
    }
  };

  // أعمدة جدول طلبات الصيانة
  const columns = [
    {
      title: 'رقم الطلب',
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
      title: 'الوصف',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: 'الأولوية',
      dataIndex: 'priority',
      key: 'priority',
      render: priority => (
        <Tag color={
          priority === 'URGENT' ? 'red' : 
          priority === 'HIGH' ? 'orange' : 
          priority === 'MEDIUM' ? 'blue' : 
          'green'
        }>
          {priority}
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
            status === 'IN_PROGRESS' ? 'processing' : 
            status === 'COMPLETED' ? 'success' : 
            'error'
          } 
          text={status} 
        />
      )
    },
    {
      title: 'تاريخ الطلب',
      dataIndex: 'createdAt',
      key: 'date',
      render: date => new Date(date).toLocaleString('ar-SA')
    },
    {
      title: 'إشعار الفني',
      dataIndex: 'technicianNotified',
      key: 'notified',
      render: notified => (
        notified ? 
        <Tag color="green">تم الإشعار</Tag> : 
        <Tag color="red">لم يتم الإشعار</Tag>
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
            icon={<EditOutlined />} 
            onClick={() => showDetailsModal(record)}
          >
            التفاصيل
          </Button>
          
          {!record.technicianNotified && (
            <Button 
              size="small" 
              icon={<SendOutlined />} 
              onClick={() => notifyTechnician(record.id)}
            >
              إشعار الفني
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={24}>
          <Card>
            <Title level={4}>طلبات الصيانة</Title>
            <Divider />
            
            <Row gutter={[16, 16]} justify="space-between" align="middle">
              <Col xs={24} md={16}>
                <Space>
                  <Button 
                    type="primary" 
                    icon={<ReloadOutlined />} 
                    onClick={fetchMaintenanceRequests}
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
                    <Option value="IN_PROGRESS">قيد التنفيذ</Option>
                    <Option value="COMPLETED">مكتمل</Option>
                    <Option value="REJECTED">مرفوض</Option>
                  </Select>
                  
                  <Select
                    placeholder="تصفية حسب الأولوية"
                    value={filterPriority}
                    onChange={value => setFilterPriority(value)}
                    style={{ width: 150 }}
                  >
                    <Option value="all">جميع الأولويات</Option>
                    <Option value="LOW">منخفضة</Option>
                    <Option value="MEDIUM">متوسطة</Option>
                    <Option value="HIGH">عالية</Option>
                    <Option value="URGENT">عاجلة</Option>
                  </Select>
                </Space>
              </Col>
            </Row>
            
            <Divider />
            
            <Row gutter={[16, 16]} className="mb-4">
              <Col xs={24} sm={12} md={6} lg={4}>
                <Card size="small">
                  <Statistic
                    title="إجمالي الطلبات"
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
                    title="قيد التنفيذ"
                    value={statsData.inProgress}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
              
              <Col xs={24} sm={12} md={6} lg={4}>
                <Card size="small">
                  <Statistic
                    title="مكتمل"
                    value={statsData.completed}
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
              dataSource={filteredRequests} 
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: true }}
            />
          </Card>
        </Col>
      </Row>

      {/* نافذة تفاصيل وتعديل طلب الصيانة */}
      <Modal
        title={`تفاصيل طلب الصيانة رقم ${detailsModal.record?.id}`}
        open={detailsModal.visible}
        onCancel={closeDetailsModal}
        footer={null}
        width={700}
      >
        {detailsModal.record && (
          <>
            <Divider orientation="right">معلومات الطلب</Divider>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>رقم العميل: </Text>
                <Text>{detailsModal.record.clientId}</Text>
              </Col>
              <Col span={12}>
                <Text strong>رقم العقار: </Text>
                <Text>{detailsModal.record.propertyId || 'غير محدد'}</Text>
              </Col>
              <Col span={12}>
                <Text strong>رقم الوحدة: </Text>
                <Text>{detailsModal.record.unitId || 'غير محدد'}</Text>
              </Col>
              <Col span={12}>
                <Text strong>تاريخ الطلب: </Text>
                <Text>{new Date(detailsModal.record.createdAt).toLocaleString('ar-SA')}</Text>
              </Col>
              <Col span={24}>
                <Text strong>الوصف: </Text>
                <br />
                <Text>{detailsModal.record.description}</Text>
              </Col>
            </Row>
            
            <Divider orientation="right">تحديث الطلب</Divider>
            <Form
              form={updateForm}
              layout="vertical"
              onFinish={updateMaintenanceRequest}
            >
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Form.Item
                    name="status"
                    label="الحالة"
                  >
                    <Select>
                      <Option value="PENDING">قيد الانتظار</Option>
                      <Option value="IN_PROGRESS">قيد التنفيذ</Option>
                      <Option value="COMPLETED">مكتمل</Option>
                      <Option value="REJECTED">مرفوض</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="priority"
                    label="الأولوية"
                  >
                    <Select>
                      <Option value="LOW">منخفضة</Option>
                      <Option value="MEDIUM">متوسطة</Option>
                      <Option value="HIGH">عالية</Option>
                      <Option value="URGENT">عاجلة</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="technicianNotified"
                    valuePropName="checked"
                  >
                    <Checkbox>تم إشعار الفني</Checkbox>
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Space>
                    <Button type="primary" htmlType="submit">
                      حفظ التغييرات
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
MaintenanceTab.info = {
  title: 'طلبات الصيانة',
  icon: 'ToolOutlined'
};

export default MaintenanceTab;
