variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
  default     = "codespace-op"
}

variable "kubernetes_version" {
  description = "Kubernetes version for the EKS cluster"
  type        = string
  default     = "1.28"
}

variable "environment" {
  description = "Deployment environment (staging or production)"
  type        = string
  default     = "staging"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones for subnets"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "private_subnets" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnets" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "node_instance_types" {
  description = "EC2 instance types for general node group"
  type        = list(string)
  default     = ["t3.large"]
}

variable "node_desired_size" {
  description = "Desired number of nodes in general group"
  type        = number
  default     = 2
}

variable "node_min_size" {
  description = "Minimum number of nodes in general group"
  type        = number
  default     = 1
}

variable "node_max_size" {
  description = "Maximum number of nodes in general group"
  type        = number
  default     = 5
}

variable "workspace_node_instance_types" {
  description = "EC2 instance types for workspace node group"
  type        = list(string)
  default     = ["t3.xlarge"]
}

variable "workspace_node_desired_size" {
  description = "Desired number of workspace nodes"
  type        = number
  default     = 1
}

variable "workspace_node_min_size" {
  description = "Minimum number of workspace nodes"
  type        = number
  default     = 0
}

variable "workspace_node_max_size" {
  description = "Maximum number of workspace nodes"
  type        = number
  default     = 10
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "codespace-op"
    ManagedBy   = "terraform"
  }
}
