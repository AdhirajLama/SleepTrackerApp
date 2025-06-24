class Rectangle {
    double length;
    double width;
    
    void setDimensions(double l, double w) {
        length = l;
        width = w;
    }

    double calculateArea() {
        return length * width;
    }

    double calculatePerimeter() {
        return 2 * (length + width);
    }
}

public class Main {
    public static void main(String[] args) {
        Rectangle rec = new Rectangle();

        rec.setDimensions(7.00, 8.00);
        System.out.println("Area: " + rec.calculateArea());
        System.out.println("Perimeter: " + rec.calculatePerimeter());
    }
}
