//@ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import _ from 'lodash';

const App = ({ apiKey }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [executionId, setExecutionId] = useState(null);

  // Define blockchain colors
  const colors = {
    ethereum: '#716b94',
    solana: '#14F195',
    bitcoin: '#F7931A',
    bnb: '#F3BA2F',
    arbitrum: '#28A0F0',
    base: '#0052FF',
    optimism: '#FF0420',
    polygon: '#8247E5',
    avalanche_c: '#E84142',
    tron: '#FF0013',
    zksync: '#4E529A',
    fantom: '#1969FF',
    mantle: '#0000FF',
    linea: '#23A7F2',
    scroll: '#FDB82B',
    blast: '#000000',
    ronin: '#D6F5D6',
    celo: '#35D07F',
    zkevm: '#8C8C8C',
    gnosis: '#03fc1c',
    zora: '#909090',
    sei: '#FF00FF'
  };

  const fetchDuneData = async () => {
    setLoading(true);
    setError(null);

    try {
      const queryId = 4660392;
      console.log('Initiating query execution...');
      const executeResponse = await fetch(`https://api.dune.com/api/v1/query/${queryId}/execute`, {
        method: 'POST',
        headers: {
          'x-dune-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          parameters: {}
        })
      });

      const responseData = await executeResponse.json();
      console.log('Execute response:', responseData);

      if (!executeResponse.ok) {
        throw new Error(`Failed to execute query: ${responseData.error || 'Unknown error'}`);
      }

      setExecutionId(responseData.execution_id);
    } catch (err) {
      console.error('Error details:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const processChartData = (rawData) => {
    console.log('Raw data before processing:', rawData);
    
    // Get all unique blockchains first
    const blockchains = Array.from(new Set(rawData.map(item => item.blockchain)));
    console.log('Unique blockchains:', blockchains);

    // Group by month
    const grouped = _.groupBy(rawData, 'month');
    
    // Transform the data
    const transformedData = Object.entries(grouped).map(([month, items]) => {
      const monthData = { month };
      
      // Initialize all blockchains with 0
      blockchains.forEach(chain => {
        monthData[chain] = 0;
      });
      
      // Fill in actual values
      items.forEach(({ blockchain, gas_fees }) => {
        monthData[blockchain] = gas_fees;
      });
      
      return monthData;
    });

    // Sort chronologically
    const sortedData = transformedData.sort((a, b) => new Date(a.month) - new Date(b.month));
    console.log('Processed data:', sortedData);
    
    return sortedData;
  };

  const checkStatus = async (execId) => {
    if (!execId) return;

    try {
      console.log('Checking status for execution:', execId);
      const statusResponse = await fetch(`https://api.dune.com/api/v1/execution/${execId}/status`, {
        headers: {
          'x-dune-api-key': apiKey
        }
      });

      const statusData = await statusResponse.json();
      console.log('Status response:', statusData);

      if (statusData.is_execution_finished) {
        console.log('Execution finished, fetching final results...');
        const resultsResponse = await fetch(`https://api.dune.com/api/v1/execution/${execId}/results`, {
          headers: {
            'x-dune-api-key': apiKey
          }
        });

        const resultsData = await resultsResponse.json();
        console.log('Results data:', resultsData);
        const processedData = processChartData(resultsData.result?.rows || []);
        setData(processedData);
        setLoading(false);
        return;
      }

      if (statusData.state === 'FAILED') {
        setError('Query execution failed');
        setLoading(false);
        return;
      }

      if (!statusData.is_execution_finished && statusData.state !== 'FAILED') {
        console.log('Query still running, checking again in 2 seconds...');
        setTimeout(() => checkStatus(execId), 2000);
      }
    } catch (err) {
      console.error('Status check error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuneData();
    return () => {
      setLoading(false);
      setExecutionId(null);
    };
  }, []);

  useEffect(() => {
    if (executionId) {
      checkStatus(executionId);
    }
  }, [executionId]);

  const containerStyle = {
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    width: '1200px',
    margin: '20px',
    padding: '20px',
    borderRadius: '8px'
  };

  if (loading) {
    return <div style={containerStyle}>Loading data...</div>;
  }

  if (error) {
    return <div style={containerStyle}>Error: {error}</div>;
  }

  if (!data) {
    return <div style={containerStyle}>No data available</div>;
  }

  // Log available keys for debugging
  console.log('Available data keys:', Object.keys(data[0]));

  return (
    <div style={containerStyle}>
      <h2 style={{ 
        marginBottom: '50px', 
        fontSize: '24px',
        padding: '20px'
      }}>Blockchain Gas Fees</h2>
      
      <div style={{ width: '100%', height: 'calc(100vh - 80px)' }}>
        <ResponsiveContainer>
          <BarChart 
            data={data}
            margin={{ top: 20, right: 30, left: 50, bottom: 50 }}
            stackOffset="normal"
          >
            <XAxis 
              dataKey="month" 
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear().toString().slice(2)}`;
              }}
              stroke="#ffffff"
            />
            <YAxis 
              tickFormatter={(value) => {
                if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                return value.toFixed(1);
              }}
              stroke="#ffffff"
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#2a2a2a',
                border: 'none',
                color: '#ffffff',
              }}
              formatter={(value) => value.toLocaleString()}
            />
            <Legend 
              wrapperStyle={{
                color: '#ffffff'
              }}
            />
            {Object.keys(data[0])
              .filter(key => key !== 'month')
              .map((blockchain) => (
                <Bar 
                  key={blockchain}
                  dataKey={blockchain}
                  name={blockchain.replace('_', ' ')}
                  fill={colors[blockchain] || '#8884d8'}
                  stackId="a"
                />
              ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default App;
