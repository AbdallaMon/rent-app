import React, { useState } from 'react';
import {Box, Card, CardContent, CardHeader, CircularProgress, Typography} from '@mui/material';
import {Pie} from 'react-chartjs-2';
import Link from "next/link";

// Create a separate ChartComponent that can be exported
const ChartComponent = ({ data }) => (
  <Box sx={{width: '100%', display: 'flex', justifyContent: 'center'}}>
    <Box sx={{maxWidth: '300px', width: '100%'}}>
      <Pie data={data} options={{responsive: true}} />
    </Box>
  </Box>
);

const CardComponent = ({headers, values, loading, chartData, href, hrefIndex}) => {
  // Add state to track whether chart is visible
  const [showChart, setShowChart] = useState(false);
  
  // Function to toggle chart visibility
  const toggleChart = () => {
    setShowChart(!showChart);
  };

  return (
    <Card
      sx={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        mb: 0,
        borderCollapse: 'collapse',
        borderRadius: "0px",
        
      }}
    >
      <CardHeader
        title={
          <Box sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            {headers.map((header, index) => (
              <Typography key={index} variant="h6" sx={{
                flex: 1,
                textAlign: 'center',
                borderRight: index < headers.length - 1 ? '1px solid #ccc' : 'none',
                p: "16px 0"
              }}>
                {header}
              </Typography>
            ))}
          </Box>
        }
        sx={{
          width: "100%",
          backgroundColor: "primary.main",
          color: "common.white",
          textAlign: "center",
          p: 0,
          borderBottom: '1px solid #ccc'
        }}
      />
      <CardContent
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          p: 0,
          borderTop: '1px solid #ccc'
        }}
      >
        <Box 
          sx={{
            width: '100%', 
            display: 'flex', 
            justifyContent: 'space-between', 
            padding: '0 0',
            cursor: 'pointer' // Add pointer cursor to indicate clickability
          }}
          onClick={toggleChart} // Add click handler to toggle chart
        >
          {loading ? (
            <CircularProgress/>
          ) : (
            values.map((value, index) => (
              <React.Fragment key={index}>
                {href && hrefIndex === index ?
                  <Typography 
                    variant="h5" 
                    sx={{
                      flex: 1,
                      textAlign: 'center',
                      borderRight: index < values.length - 1 ? '1px solid #ccc' : 'none',
                      p: "16px 0",
                      borderBottom: '1px solid #ccc',
                      color: "#03a9f4",
                      textDecoration: "underline"
                    }}
                    // Prevent propagation to avoid toggling chart when clicking the link
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link href={href}>
                      {value}
                    </Link>
                  </Typography>
                  :
                  <Typography variant="h5" sx={{
                    flex: 1,
                    textAlign: 'center',
                    borderRight: index < values.length - 1 ? '1px solid #ccc' : 'none',
                    p: "16px 0",
                    borderBottom: '1px solid #ccc'
                  }}>
                    {value}
                  </Typography>
                }
              </React.Fragment>
            ))
          )}
        </Box>
        {/* Only show chart if showChart is true and chartData exists */}
        {showChart && chartData && (
          <Box sx={{width: '100%', display: 'flex', justifyContent: 'center', marginTop: '20px'}}>
            <Box sx={{maxWidth: '300px'}}>
              <Pie data={chartData} options={{responsive: true}}/>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Attach ChartComponent to CardComponent to support CardComponent.ChartComponent usage
CardComponent.ChartComponent = ChartComponent;

export default CardComponent;