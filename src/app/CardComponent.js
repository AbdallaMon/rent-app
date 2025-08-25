import React from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Typography,
  useTheme,
  Skeleton,
} from "@mui/material";
import Link from "next/link";
import { Pie } from "react-chartjs-2";

// small, theme-aware chart wrapper
const ChartComponent = ({ data }) => {
  const theme = useTheme();
  return (
    <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <Box sx={{ maxWidth: 320, width: "100%", px: 2, pb: 2 }}>
        <Pie
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                position: "bottom",
                labels: {
                  color: theme.palette.text.primary,
                  boxWidth: 14,
                },
              },
              title: { display: false },
              datalabels: {
                color: theme.palette.getContrastText(
                  theme.palette.background.paper
                ),
                formatter: (val, ctx) => {
                  const total =
                    ctx.dataset.data.reduce((a, b) => a + b, 0) || 0;
                  const pct = total ? Math.round((val / total) * 100) : 0;
                  return `${pct}%`;
                },
                font: {
                  weight: 600,
                },
              },
            },
          }}
        />
      </Box>
    </Box>
  );
};

const RowCell = ({ children, withDivider }) => (
  <Typography
    variant="h6"
    sx={{
      flex: 1,
      textAlign: "center",
      p: 2,
      borderInlineEnd: withDivider
        ? (theme) => `1px solid ${theme.palette.divider}`
        : "none",
      m: 0,
      minHeight: 56,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 600,
    }}
  >
    {children}
  </Typography>
);

const ValueCell = ({ children, withDivider, linkColor }) => (
  <Typography
    variant="h5"
    sx={{
      flex: 1,
      textAlign: "center",
      p: 2,
      borderInlineEnd: withDivider
        ? (theme) => `1px solid ${theme.palette.divider}`
        : "none",
      borderTop: (theme) => `1px solid ${theme.palette.divider}`,
      minHeight: 64,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: linkColor || "text.primary",
      fontWeight: 700,
    }}
  >
    {children}
  </Typography>
);

const CardComponent = ({
  headers,
  values,
  loading,
  chartData,
  href,
  hrefIndex,
  showChart,
  onToggleChart,
}) => {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        width: "100%",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        overflow: "hidden",
        bgcolor: "background.paper",
        transition: "box-shadow .2s ease, transform .04s ease",
        "&:hover": {
          boxShadow: 2,
        },
      }}
    >
      <CardHeader
        title={
          <Box
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "stretch",
            }}
          >
            {headers.map((header, i) => (
              <RowCell key={i} withDivider={i < headers.length - 1}>
                {header}
              </RowCell>
            ))}
          </Box>
        }
        sx={{
          px: 0,
          py: 0,
          bgcolor: (t) => t.palette.action.hover,
          color: "text.primary",
          borderBottom: (t) => `1px solid ${t.palette.divider}`,
        }}
      />

      <CardContent sx={{ p: 0 }}>
        <Box
          role="button"
          tabIndex={0}
          onClick={onToggleChart}
          onKeyDown={(e) =>
            e.key === "Enter" || e.key === " " ? onToggleChart() : null
          }
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          {loading ? (
            <Box
              sx={{
                width: "100%",
                p: 3,
                display: "flex",
                justifyContent: "center",
              }}
            >
              {/* skeleton gives a calmer loading state */}
              <Box sx={{ width: "100%", display: "flex" }}>
                {[0, 1, 2].map((i) => (
                  <Box
                    key={i}
                    sx={{
                      flex: 1,
                      borderInlineEnd:
                        i < 2
                          ? (t) => `1px solid ${t.palette.divider}`
                          : "none",
                      p: 2,
                    }}
                  >
                    <Skeleton height={28} />
                    <Skeleton height={32} sx={{ mt: 1 }} />
                  </Box>
                ))}
              </Box>
            </Box>
          ) : (
            values.map((value, i) => {
              const isLink = href && hrefIndex === i;
              return (
                <React.Fragment key={i}>
                  {isLink ? (
                    <ValueCell
                      withDivider={i < values.length - 1}
                      linkColor={theme.palette.info.main}
                    >
                      <Link href={href} onClick={(e) => e.stopPropagation()}>
                        {value}
                      </Link>
                    </ValueCell>
                  ) : (
                    <ValueCell withDivider={i < values.length - 1}>
                      {value}
                    </ValueCell>
                  )}
                </React.Fragment>
              );
            })
          )}
        </Box>

        {showChart && chartData && <ChartComponent data={chartData} />}
      </CardContent>
    </Card>
  );
};

CardComponent.ChartComponent = ChartComponent;
export default CardComponent;
