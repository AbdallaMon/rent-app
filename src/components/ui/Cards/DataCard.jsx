import React from "react";
import { Card, CardContent, Typography, Button } from "@mui/material";

const DataCard = ({ row, columns, handleEdit }) => {
  return (
    <Card className="m-4">
      <CardContent
        sx={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        {columns.map((column) => (
          <div
            key={column.field}
            className={"flex gap-2 items-center"}
            style={{
              width: `${column.cardWidth}%`,
            }}
          >
            <Typography variant="subtitle1" color="textSecondary">
              {column.headerName}
              {column.headerName && ":"}
            </Typography>
            <Typography variant="body2">
              {column.renderCell
                ? column.renderCell({ row })
                : column.type === "size"
                  ? row[column.field].length
                  : row[column.field]}
            </Typography>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default DataCard;
