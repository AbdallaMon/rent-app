/**
 * تاب التذكيرات - يعرض إعدادات ومعلومات نظام التذكيرات
 * مرتبط بنظام التذكيرات التلقائي (automated-reminder-cron-job.js)
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
  Row,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tabs,
  Tag,
  TimePicker,
  Typography
} from '../../ui/CustomComponents';

import {
  ReloadOutlined,
  SendOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '../../icons/Icons';

const { Title, Text } = Typography;
const { Option } = Select;

const RemindersTab = () => {
  const [loading, setLoading] = useState(false);
  const [reminderStats, setReminderStats] = useState({
    paymentReminders: 0,
    contractReminders: 0,
    maintenanceReminders: 0,
    sentToday: 0,
    pendingToday: 0,
    failedToday: 0
  });
  const [reminderSettings, setReminderSettings] = useState({
    enabled: true,
    frequency: 'daily',
    contractReminderDays: 30,
    financialReminderDays: 7,
    maintenanceReminderDays: 3
  });
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [recentReminders, setRecentReminders] = useState([]);
  const [form] = Form.useForm();

  // جلب بيانات التذكيرات
  const fetchReminderData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/whatsapp/reminders');
      const result = await response.json();
      
      if (result.success && result.data) {
        setReminderStats({
          paymentReminders: result.data.stats.paymentReminders || 0,
          contractReminders: result.data.stats.contractReminders || 0,
          maintenanceReminders: result.data.stats.maintenanceReminders || 0,
          sentToday: result.data.sentToday?.total || 0,
          pendingToday: result.data.stats.pendingToday || 0,
          failedToday: result.data.stats.failedReminders || 0
        });
        
        setReminderSettings(result.data.settings);
        setUpcomingReminders(result.data.upcomingReminders || []);
        setRecentReminders(result.data.recentReminders || []);
        
        // تحديث الفورم بالإعدادات الجديدة
        form.setFieldsValue(result.data.settings);
      }
    } catch (error) {
      console.error('Error loading reminder data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminderData();
    
    // تحديث البيانات كل 5 دقائق
    const interval = setInterval(fetchReminderData, 300000);
    return () => clearInterval(interval);
  }, []);

  // تشغيل التذكيرات يدوياً
  const runRemindersManually = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/whatsapp/dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'run_reminders' })
      });
      
      const result = await response.json();
      
      if (result.success) {
        message.success('تم تشغيل التذكيرات بنجاح');
        
        // إعادة جلب البيانات بعد التشغيل
        setTimeout(fetchReminderData, 2000);
      } else {
        message.error(result.message || 'فشل في تشغيل التذكيرات');
      }
    } catch (error) {
      console.error('Error running reminders:', error);
      message.error('فشل في تشغيل التذكيرات');
    } finally {
      setLoading(false);
    }
  };

  // حفظ إعدادات التذكيرات
  const saveReminderSettings = async (values) => {
    try {
      const response = await fetch('/api/admin/whatsapp/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'reminder_settings',
          settings: values
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        message.success('تم حفظ الإعدادات بنجاح');
      } else {
        message.error(result.message || 'فشل في حفظ الإعدادات');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      message.error('فشل في حفظ الإعدادات');
    }
  };

  // أعمدة جدول التذكيرات القادمة
  const upcomingColumns = [
    {
      title: 'النوع',
      dataIndex: 'type',
      key: 'type',
      render: type => (
        <Tag color={
          type === 'payment' ? 'green' : 
          type === 'contract' ? 'blue' : 
          'orange'
        }>
          {type === 'payment' ? 'دفعة' : 
           type === 'contract' ? 'عقد' : 
           'صيانة'}
        </Tag>
      )
    },
    {
      title: 'العميل',
      dataIndex: 'clientName',
      key: 'client'
    },
    {
      title: 'رقم الهاتف',
      dataIndex: 'phoneNumber',
      key: 'phone'
    },
    {
      title: 'الموعد المقرر',
      dataIndex: 'scheduledDate',
      key: 'date',
      render: date => new Date(date).toLocaleString('ar-SA')
    },
    {
      title: 'الحالة',
      key: 'status',
      render: () => <Badge status="processing" text="مجدول" />
    }
  ];

  // أعمدة جدول التذكيرات الأخيرة
  const recentColumns = [
    {
      title: 'النوع',
      dataIndex: 'type',
      key: 'type',
      render: type => (
        <Tag color={
          type === 'payment' ? 'green' : 
          type === 'contract' ? 'blue' : 
          'orange'
        }>
          {type === 'payment' ? 'دفعة' : 
           type === 'contract' ? 'عقد' : 
           'صيانة'}
        </Tag>
      )
    },
    {
      title: 'العميل',
      dataIndex: 'clientName',
      key: 'client'
    },
    {
      title: 'الحالة',
      dataIndex: 'status',
      key: 'status',
      render: status => (
        <Badge 
          status={status === 'sent' ? 'success' : 'error'} 
          text={status === 'sent' ? 'تم الإرسال' : 'فشل'} 
        />
      )
    },
    {
      title: 'وقت الإرسال',
      dataIndex: 'sentAt',
      key: 'sentAt',
      render: date => new Date(date).toLocaleString('ar-SA')
    }
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        {/* إحصائيات التذكيرات */}
        <Col xs={24} lg={24}>
          <Card title="إحصائيات التذكيرات">
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={8} md={4}>
                <Statistic 
                  title="تذكيرات الدفعات"
                  value={reminderStats.paymentReminders}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Statistic 
                  title="تذكيرات العقود"
                  value={reminderStats.contractReminders}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Statistic 
                  title="تذكيرات الصيانة"
                  value={reminderStats.maintenanceReminders}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Statistic 
                  title="مرسل اليوم"
                  value={reminderStats.sentToday}
                  valueStyle={{ color: '#13c2c2' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Statistic 
                  title="قيد الانتظار"
                  value={reminderStats.pendingToday}
                  valueStyle={{ color: '#722ed1' }}
                  prefix={<ClockCircleOutlined />}
                />
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Statistic 
                  title="فشل اليوم"
                  value={reminderStats.failedToday}
                  valueStyle={{ color: '#f5222d' }}
                  prefix={<ExclamationCircleOutlined />}
                />
              </Col>
            </Row>
            
            <Divider />
            
            <Button 
              type="primary" 
              icon={<SendOutlined />} 
              onClick={runRemindersManually} 
              loading={loading}
            >
              تشغيل التذكيرات الآن
            </Button>
          </Card>
        </Col>

        {/* إعدادات التذكيرات */}
        <Col xs={24} lg={12}>
          <Card title="إعدادات التذكيرات">
            <Form
              form={form}
              layout="vertical"
              initialValues={reminderSettings}
              onFinish={saveReminderSettings}
            >
              <Form.Item
                name="enabled"
                label="تفعيل نظام التذكيرات التلقائية"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              
              <Form.Item
                name="frequency"
                label="تكرار التذكيرات"
              >
                <Select>
                  <Option value="daily">يومياً</Option>
                  <Option value="weekly">أسبوعياً</Option>
                  <Option value="custom">مخصص</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="contractReminderDays"
                label="التذكير بانتهاء العقد قبل (بالأيام)"
              >
                <Select>
                  <Option value={7}>7 أيام</Option>
                  <Option value={15}>15 يوم</Option>
                  <Option value={30}>30 يوم</Option>
                  <Option value={60}>60 يوم</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="financialReminderDays"
                label="التذكير بالدفعات المستحقة قبل (بالأيام)"
              >
                <Select>
                  <Option value={1}>يوم واحد</Option>
                  <Option value={3}>3 أيام</Option>
                  <Option value={7}>7 أيام</Option>
                  <Option value={14}>14 يوم</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="maintenanceReminderDays"
                label="تذكير الصيانة قبل (بالأيام)"
              >
                <Select>
                  <Option value={1}>يوم واحد</Option>
                  <Option value={2}>يومين</Option>
                  <Option value={3}>3 أيام</Option>
                  <Option value={7}>7 أيام</Option>
                </Select>
              </Form.Item>
              
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  حفظ الإعدادات
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* التذكيرات القادمة */}
        <Col xs={24} lg={12}>
          <Card 
            title="التذكيرات القادمة" 
            extra={
              <Button icon={<ReloadOutlined />} onClick={fetchReminderData}>تحديث</Button>
            }
          >
            <Table 
              columns={upcomingColumns} 
              dataSource={upcomingReminders}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 5 }}
              scroll={{ x: true }}
            />
          </Card>
        </Col>

        {/* أحدث التذكيرات المرسلة */}
        <Col xs={24} lg={24}>
          <Card title="أحدث التذكيرات المرسلة">
            <Table 
              columns={recentColumns} 
              dataSource={recentReminders}
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
RemindersTab.info = {
  title: 'التذكيرات',
  icon: 'ClockCircleOutlined'
};

export default RemindersTab;
