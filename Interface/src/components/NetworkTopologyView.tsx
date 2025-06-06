
import { useRef, useEffect } from "react";
import { NetworkTopology, NetworkNode, NetworkLink } from "@/types";

interface NetworkTopologyViewProps {
  topology: NetworkTopology;
}

const NetworkTopologyView = ({ topology }: NetworkTopologyViewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Function to draw the network topology on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size to match its display size
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw links
    topology.links.forEach(link => {
      const sourceNode = topology.nodes.find(node => node.id === link.source);
      const targetNode = topology.nodes.find(node => node.id === link.target);
      
      if (sourceNode && targetNode) {
        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        
        // Set color based on status
        if (link.status === undefined) {
          ctx.strokeStyle = '#94a3b8'; // slate-400
        } else if (link.status) {
          ctx.strokeStyle = '#22c55e'; // green-500
        } else {
          ctx.strokeStyle = '#ef4444'; // red-500
        }
        
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
    
    // Draw nodes
    topology.nodes.forEach(node => {
      ctx.beginPath();
      
      // Different colors for different node types
      switch (node.type) {
        case 'controller':
          ctx.fillStyle = '#3b82f6'; // blue-500
          ctx.strokeStyle = '#1e40af'; // blue-800
          break;
        case 'switch':
          ctx.fillStyle = '#8b5cf6'; // violet-500
          ctx.strokeStyle = '#5b21b6'; // violet-800
          break;
        case 'host':
          ctx.fillStyle = '#f97316'; // orange-500
          ctx.strokeStyle = '#9a3412'; // orange-800
          break;
        default:
          ctx.fillStyle = '#94a3b8'; // slate-400
          ctx.strokeStyle = '#334155'; // slate-700
      }
      
      // Draw node
      ctx.arc(node.x, node.y, 15, 0, 2 * Math.PI);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Add node label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.id, node.x, node.y);
      
      // Add node type and IP below the node
      ctx.fillStyle = '#0f172a'; // slate-900
      ctx.font = '10px sans-serif';
      ctx.fillText(node.type, node.x, node.y + 30);
      if (node.ip) {
        ctx.fillText(node.ip, node.x, node.y + 45);
      }
    });
    
  }, [topology]);
  
  return (
    <div className="w-full h-[400px] relative">
      <canvas 
        ref={canvasRef}
        className="w-full h-full rounded-lg border"
      />
    </div>
  );
};

export default NetworkTopologyView;
