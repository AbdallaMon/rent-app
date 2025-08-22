/**
 * تاب الرسائل - يعرض سجل رسائل الواتساب الصادرة والواردة
 * مرتبط بجداول WhatsappMessageLog و WhatsappIncomingMessage 
 */

import React, { useState, useEffect } from 'react';
import { 
  Badge, 
  Button, 
  Card, 
  Col, 
  Divider, 
  Input, 
  Row, 
  Select, 
  Space, 
  Statistic,
  Table, 
  Tag, 
  Typography 
} from '../../ui/CustomComponents';

import { ReloadOutlined, SearchOutlined, DownloadOutlined } from '../../icons/Icons';

const { Title, Text } = Typography;

const MessagesTab = () => {
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [statsData, setStatsData] = useState({
    total: 0,
    sent: 0,
    delivered: 0,
    read: 0,
    failed: 0
  });
  const [searchPhone, setSearchPhone] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [messageType, setMessageType] = useState('all');

  // جلب بيانات الرسائل
  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/whatsapp/messages?limit=100');
      const result = await response.json();
      
      if (result.success && result.data) {
        setMessages(result.data);
        
        // تحديث الإحصائيات
        const stats = {
          total: result.data.length,
          sent: result.data.filter(msg => msg.status === 'sent').length,
          delivered: result.data.filter(msg => msg.status === 'delivered').length,
          read: result.data.filter(msg => msg.status === 'read').length,
          failed: result.data.filter(msg => msg.status === 'failed').length
        };
        
        setStatsData(stats);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    
    // تحديث البيانات كل دقيقة
    const interval = setInterval(fetchMessages, 60000);
    return () => clearInterval(interval);
  }, []);

  // تصفية الرسائل
  const filteredMessages = messages.filter(message => {
    let matchesPhone = true;
    let matchesStatus = true;
    let matchesType = true;
    
    if (searchPhone) {
      matchesPhone = message.recipient?.includes(searchPhone) || message.sender?.includes(searchPhone);
    }
    
    if (filterStatus !== 'all') {
      matchesStatus = message.status === filterStatus;
    }
    
    if (messageType !== 'all') {
      matchesType = message.messageType === messageType;
    }
    
    return matchesPhone && matchesStatus && matchesType;
  });

  const columns = [
    {
      title: 'معرف',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      ellipsis: true
    },    {
      title: 'الرقم',
      dataIndex: 'recipient',
      key: 'phone',
      render: function renderRecipient(recipient, record) {
        return recipient || record.sender;
      }
    },    {
      title: 'النوع',
      dataIndex: 'messageType',
      key: 'type',
      render: function renderMessageType(type) {
        return (
          <Tag color={type === 'reminder' ? 'gold' : type === 'template' ? 'blue' : 'green'}>
            {type}
          </Tag>
        );
      }
    },    {
      title: 'المحتوى',
      dataIndex: 'content',
      key: 'content',
      render: function renderContent(content, record) {
        return content || record.templateName || 'رسالة نصية';
      }
    },    {
      title: 'الحالة',
      dataIndex: 'status',
      key: 'status',
      render: function renderStatus(status) {
        return (
          <Badge 
            status={
              status === 'sent' ? 'processing' : 
              status === 'delivered' ? 'warning' : 
              status === 'read' ? 'success' : 'error'
            } 
            text={status} 
          />
        );
      }
    },    {
      title: 'التاريخ',
      dataIndex: 'sentAt',
      key: 'date',
      render: function renderDate(date, record) {
        const dateObj = new Date(date || record.receivedAt);
        return dateObj.toLocaleString('ar-SA');
      }
    }
  ];

  return (
    <div>
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} lg={24}>
          <Card>
            <Title level={4}>سجل الرسائل</Title>
            <Divider />
            
            <Row gutter={[16, 16]} justify="space-between" align="middle">
              <Col xs={24} md={16}>
                <Space>
                  <Button 
                    type="primary" 
                    icon={<ReloadOutlined />} 
                    onClick={fetchMessages}
                    loading={loading}
                  >
                    تحديث
                  </Button>
                  
                  <Input 
                    placeholder="بحث برقم الهاتف"
                    value={searchPhone}
                    onChange={e => setSearchPhone(e.target.value)}
                    prefix={<SearchOutlined />}
                    allowClear
                    style={{ width: 200 }}
                  />
                  
                  <Select
                    placeholder="تصفية حسب الحالة"
                    value={filterStatus}
                    onChange={value => setFilterStatus(value)}
                    style={{ width: 150 }}
                    options={[
                      { value: 'all', label: 'جميع الحالات' },
                      { value: 'sent', label: 'تم الإرسال' },
                      { value: 'delivered', label: 'تم التسليم' },
                      { value: 'read', label: 'تم القراءة' },
                      { value: 'failed', label: 'فشل' }
                    ]}
                  />
                  
                  <Select
                    placeholder="نوع الرسالة"
                    value={messageType}
                    onChange={value => setMessageType(value)}
                    style={{ width: 150 }}
                    options={[
                      { value: 'all', label: 'جميع الأنواع' },
                      { value: 'template', label: 'قالب' },
                      { value: 'text', label: 'نص' },
                      { value: 'reminder', label: 'تذكير' },
                      { value: 'automatic', label: 'تلقائي' }
                    ]}
                  />
                </Space>
              </Col>
              
              <Col xs={24} md={8} style={{ textAlign: 'right' }}>
                <Button icon={<DownloadOutlined />}>تصدير البيانات</Button>
              </Col>
            </Row>
            
            <Divider />
            
            <Row gutter={[16, 16]} className="mb-4">
              <Col xs={24} sm={8} md={4}>
                <Card size="small">
                  <Statistic
                    title="إجمالي الرسائل"
                    value={statsData.total}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              
              <Col xs={24} sm={8} md={4}>
                <Card size="small">
                  <Statistic
                    title="تم الإرسال"
                    value={statsData.sent}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
              
              <Col xs={24} sm={8} md={4}>
                <Card size="small">
                  <Statistic
                    title="تم التسليم"
                    value={statsData.delivered}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              
              <Col xs={24} sm={12} md={4}>
                <Card size="small">
                  <Statistic
                    title="تم القراءة"
                    value={statsData.read}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              
              <Col xs={24} sm={12} md={4}>
                <Card size="small">
                  <Statistic
                    title="فشل"
                    value={statsData.failed}
                    valueStyle={{ color: '#f5222d' }}
                  />
                </Card>
              </Col>
            </Row>
            
            <Table 
              columns={columns} 
              dataSource={filteredMessages} 
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: true }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// إضافة معلومات وصفية للمكون
MessagesTab.info = {
  title: 'الرسائل',
  icon: 'MessageOutlined'
};

export default MessagesTab;
