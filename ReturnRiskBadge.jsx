import React, { useEffect, useState } from 'react';
import { Box, Typography, Chip } from '@material-ui/core';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';

const API = process.env.REACT_APP_API_URL || '';

const RISK_CONFIG = {
  high: { color: '#f44336', icon: <ErrorOutlineIcon fontSize="small" />, label: 'Higher return rate' },
  average: { color: '#757575', icon: <InfoOutlinedIcon fontSize="small" />, label: 'Typical return rate' },
  low: { color: '#4caf50', icon: <CheckCircleOutlineIcon fontSize="small" />, label: 'Low return rate' },
};

const ReturnRiskBadge = ({ productId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchRisk = async () => {
      try {
        const response = await fetch(
          `${API}/api/product/${productId}/return-risk`
        );
        const result = await response.json();
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchRisk();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (loading || !data || !data.available) {
    return null; // don't show anything if there's no meaningful signal yet
  }

  const config = RISK_CONFIG[data.riskLevel];

  return (
    <Box mt={1}>
      <Chip
        icon={config.icon}
        label={config.label}
        size="small"
        style={{
          borderColor: config.color,
          color: config.color,
        }}
        variant="outlined"
      />
      <Box mt={0.5}>
        <Typography variant="caption" color="textSecondary">
          {data.message}
        </Typography>
      </Box>
    </Box>
  );
};

export default ReturnRiskBadge;
