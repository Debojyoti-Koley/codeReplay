export const EXAMPLES = [
    {
        label: 'Sum array',
        code: `function sum(arr) {
  let total = 0
  for (let i = 0; i < arr.length; i++) {
    total += arr[i]
  }
  return total
}

sum([1, 2, 3, 4])`,
    },
    {
        label: 'Fibonacci',
        code: `function fibonacci(n) {
  if (n <= 1) return n
  let a = 0
  let b = 1
  for (let i = 2; i <= n; i++) {
    let temp = a + b
    a = b
    b = temp
  }
  return b
}

fibonacci(6)`,
    },
    {
        label: 'Binary search',
        code: `function binarySearch(arr, target) {
  let left = 0
  let right = arr.length - 1

  while (left <= right) {
    let mid = Math.floor((left + right) / 2)
    if (arr[mid] === target) return mid
    if (arr[mid] < target) left = mid + 1
    else right = mid - 1
  }

  return -1
}

binarySearch([1, 3, 5, 7, 9, 11], 7)`,
    },
    {
        label: 'Flatten array',
        code: `function flatten(arr) {
  let result = []
  for (let i = 0; i < arr.length; i++) {
    if (Array.isArray(arr[i])) {
      let inner = flatten(arr[i])
      for (let j = 0; j < inner.length; j++) {
        result.push(inner[j])
      }
    } else {
      result.push(arr[i])
    }
  }
  return result
}

flatten([1, [2, [3, 4]], 5])`,
    },
]