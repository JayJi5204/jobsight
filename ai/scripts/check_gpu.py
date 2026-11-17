import torch

print(f"torch 버전: {torch.__version__}")
print(f"torch가 쓰는 CUDA: {torch.version.cuda}")
print(f"CUDA 사용 가능: {torch.cuda.is_available()}")

if not torch.cuda.is_available():
    print("GPU 를 못 찾았다. 여기서 멈춘다.")
    raise SystemExit

print(f"GPU 이름: {torch.cuda.get_device_name(0)}")

# compute capability. Blackwell(RTX 5090)은 (12, 0) 이다.
capability = torch.cuda.get_device_capability(0)
print(f"compute capability: {capability}")

# is_available() 이 True 여도 실제 커널이 없으면 여기서 터진다.
# 그래서 행렬곱까지 해 봐야 진짜 쓸 수 있는지 안다.
print("행렬곱 시험 중...")
x = torch.randn(1000, 1000, device="cuda")
y = x @ x
print(f"성공. 결과 합계: {y.sum().item():.2f}")
