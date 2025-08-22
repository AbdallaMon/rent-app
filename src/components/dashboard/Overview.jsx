import React from 'react';
import { Card, Row, Col, Badge, Button, Statistic } from '../ui/Elements';
import { DashboardOutlined, SyncOutlined } from '../icons';

export default function Overview({ data, loading, onRefresh }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DashboardOutlined className="text-blue-600 text-lg" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">النظرة العامة</h2>
              <p className="text-sm text-gray-600">
                آخر تحديث: {new Date().toLocaleString('ar-AE')}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <Badge status="processing" text="مباشر" />
            <Button 
              icon={<SyncOutlined />} 
              onClick={onRefresh}
              loading={loading}
              size="small"
            >
              تحديث
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="border-l-4 border-l-green-500">
            <Statistic
              title="إجمالي الرسائل"
              value={data?.stats?.totalMessages || 0}
              prefix="📨"
            />
          </Card>
        </Col>
        {/* Add more stats */}
      </Row>
    </div>
  );
}
