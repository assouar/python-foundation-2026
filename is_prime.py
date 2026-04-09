"""
is_prime.py - Prime Number Checker
Author: Ayoub Assouar
A simple script that asks the user for a number and determines if it is prime.
"""


def is_prime(n):
    """
    Check if a number is prime.
    A prime number is a natural number greater than 1
    that has no positive divisors other than 1 and itself.
    """
    # Edge case: numbers less than or equal to 1 are not prime
    if n <= 1:
        return False

    # Edge case: 2 is the only even prime number
    if n == 2:
        return True

    # Edge case: any other even number is not prime
    if n % 2 == 0:
        return False

    # Check odd divisors from 3 up to the square root of n
    # We only need to check up to sqrt(n) because if n has a factor
    # greater than sqrt(n), it must also have a factor smaller than sqrt(n)
    i = 3
    while i * i <= n:
        if n % i == 0:
            return False
        i += 2  # Skip even numbers for efficiency

    return True


def main():
    """Main function: get user input and display the result."""
    try:
        # Ask the user for a number
        user_input = input("Enter a number: ")
        number = int(user_input)

        # Determine if the number is prime
        if is_prime(number):
            print(f"{number} is a PRIME number.")
        else:
            print(f"{number} is NOT a prime number.")

    except ValueError:
        # Handle non-integer input
        print("Invalid input. Please enter a valid integer.")


# Run the script
if __name__ == "__main__":
    main()
